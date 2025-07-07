from fastapi import FastAPI, HTTPException, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import sqlite3
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import AI service functions
from ai_service import get_ai_response, get_ai_summary

app = FastAPI()

# Security configuration
SECRET_KEY = secrets.token_urlsafe(32)  # Generate a random secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CORS configuration - more secure for production
origins = [
    "https://nuudle.ai",
    "https://www.nuudle.ai",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "nuudle.db"

# Authentication Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: str

class AuthResponse(BaseModel):
    success: bool
    user: Optional[User] = None
    error: Optional[str] = None

# AI-related Models
class AIAssistRequest(BaseModel):
    sessionId: str
    stage: str
    userInput: str
    sessionContext: Dict[str, Any]

class AIAssistResponse(BaseModel):
    success: bool
    interactionId: Optional[str] = None
    response: Optional[str] = None
    cost: Optional[float] = None
    tokensUsed: Optional[int] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    fallback: Optional[str] = None

class AISummaryRequest(BaseModel):
    sessionId: str
    sessionData: Dict[str, Any]
    aiInteractionLog: Optional[List[Dict[str, Any]]] = []

class AISummaryResponse(BaseModel):
    success: bool
    interactionId: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    cost: Optional[float] = None
    tokensUsed: Optional[int] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    fallback: Optional[str] = None

# Session Models
class Fear(BaseModel):
    name: str
    mitigation: str
    contingency: str

# This is the model for creating a new session
class IssueTree(BaseModel):
    primary_cause: str
    sub_causes: List[str]

class SessionCreate(BaseModel):
    pain_point: str
    causes: List[str]
    assumptions: List[str]
    perpetuations: List[str]
    solutions: List[str]
    fears: List[Fear]
    action_plan: str
    ai_summary: Optional[dict] = None

# This is the model for reading a session from the DB
class SessionRead(BaseModel):
    id: int
    created_at: str
    pain_point: str
    issue_tree: IssueTree
    assumptions: List[str]
    perpetuations: List[str]
    solutions: List[str]
    fears: List[Fear]
    action_plan: str
    ai_summary: Optional[dict] = None
    summary_header: Optional[str] = None

def create_tables():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create sessions table (keep existing structure)
    cursor.execute("DROP TABLE IF EXISTS sessions")
    cursor.execute("""
        CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pain_point TEXT,
            issue_tree TEXT,
            assumptions TEXT,
            perpetuations TEXT,
            solutions TEXT,
            fears TEXT,
            action_plan TEXT,
            ai_summary TEXT,
            summary_header TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()

# Authentication helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def create_user(email: str, password: str):
    hashed_password = get_password_hash(password)
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (email, hashed_password)
        )
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    
    user = get_user_by_email(email)
    if user is None:
        return None
    
    return User(id=user["id"], email=user["email"])

create_tables()

def extract_summary_header(ai_summary: Optional[dict], pain_point: str) -> str:
    """Extract the title from AI summary or create a fallback header"""
    if ai_summary and isinstance(ai_summary, dict) and 'title' in ai_summary:
        title = ai_summary['title']
        if title and title.strip():
            return title.strip().lower()
    
    # Fallback: create a simple header from the first few words of pain_point
    if pain_point and pain_point.strip():
        words = pain_point.strip().split()[:3]
        return ' '.join(words).lower().replace(',', '').replace('.', '')
    
    return 'untitled session'

# Authentication Endpoints
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate, response: Response):
    # Check if user already exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        return AuthResponse(success=False, error="Email already registered")
    
    # Create new user
    user_id = create_user(user_data.email, user_data.password)
    if user_id is None:
        return AuthResponse(success=False, error="Failed to create user")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    # Set secure cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    user = User(id=user_id, email=user_data.email)
    return AuthResponse(success=True, user=user)

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin, response: Response):
    # Verify user credentials
    user = get_user_by_email(user_data.email)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        return AuthResponse(success=False, error="Invalid email or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    # Set secure cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    user_obj = User(id=user["id"], email=user["email"])
    return AuthResponse(success=True, user=user_obj)

@app.get("/api/auth/status", response_model=AuthResponse)
async def auth_status(request: Request):
    user = get_current_user(request)
    if user:
        return AuthResponse(success=True, user=user)
    else:
        return AuthResponse(success=False, error="Not authenticated")

@app.post("/api/auth/logout", response_model=AuthResponse)
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return AuthResponse(success=True)

# Session Endpoints
@app.post("/api/sessions", response_model=SessionRead)
async def create_session(session: SessionCreate, request: Request):
    # Get current user (optional for now to maintain compatibility)
    current_user = get_current_user(request)
    user_id = current_user.id if current_user else None
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Extract summary header from AI summary or create fallback
    summary_header = extract_summary_header(session.ai_summary, session.pain_point)
    
    # Create the issue_tree structure
    issue_tree = IssueTree(
        primary_cause=session.causes[0] if session.causes else "",
        sub_causes=session.causes[1:]
    )

    # Serialize JSON fields
    issue_tree_json = issue_tree.model_dump_json()
    assumptions_json = json.dumps(session.assumptions)
    perpetuations_json = json.dumps(session.perpetuations)
    solutions_json = json.dumps(session.solutions)
    fears_json = json.dumps([fear.model_dump() for fear in session.fears])
    ai_summary_json = json.dumps(session.ai_summary) if session.ai_summary else None

    cursor.execute("""
        INSERT INTO sessions (pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (session.pain_point, issue_tree_json, assumptions_json, perpetuations_json, solutions_json, fears_json, session.action_plan, ai_summary_json, summary_header, user_id))
    
    session_id = cursor.lastrowid
    conn.commit()
    
    # Retrieve the created_at value
    cursor.execute("SELECT created_at FROM sessions WHERE id = ?", (session_id,))
    created_at = cursor.fetchone()[0]
    
    conn.close()
    
    return SessionRead(
        id=session_id,
        created_at=created_at,
        pain_point=session.pain_point,
        issue_tree=issue_tree,
        assumptions=session.assumptions,
        perpetuations=session.perpetuations,
        solutions=session.solutions,
        fears=session.fears,
        action_plan=session.action_plan,
        ai_summary=session.ai_summary,
        summary_header=summary_header
    )

@app.get("/api/sessions", response_model=List[SessionRead])
def get_sessions(request: Request):
    # Get current user (optional for now to maintain compatibility)
    current_user = get_current_user(request)
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # If user is authenticated, show only their sessions; otherwise show all
    if current_user:
        cursor.execute("SELECT id, created_at, pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header FROM sessions WHERE user_id = ? ORDER BY created_at DESC", (current_user.id,))
    else:
        cursor.execute("SELECT id, created_at, pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header FROM sessions ORDER BY created_at DESC")
    
    rows = cursor.fetchall()
    conn.close()
    
    sessions = []
    for row in rows:
        sessions.append(SessionRead(
            id=row["id"],
            created_at=row["created_at"],
            pain_point=row["pain_point"],
            issue_tree=json.loads(row["issue_tree"]),
            assumptions=json.loads(row["assumptions"]),
            perpetuations=json.loads(row["perpetuations"]),
            solutions=json.loads(row["solutions"]),
            fears=json.loads(row["fears"]),
            action_plan=row["action_plan"],
            ai_summary=json.loads(row["ai_summary"]) if row["ai_summary"] else None,
            summary_header=row["summary_header"]
        ))
    return sessions

@app.get("/api/sessions/{session_id}", response_model=SessionRead)
def get_session(session_id: int, request: Request):
    current_user = get_current_user(request)
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # If user is authenticated, ensure they can only access their own sessions
    if current_user:
        cursor.execute("SELECT id, created_at, pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header FROM sessions WHERE id = ? AND user_id = ?", (session_id, current_user.id))
    else:
        cursor.execute("SELECT id, created_at, pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header FROM sessions WHERE id = ?", (session_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionRead(
        id=row["id"],
        created_at=row["created_at"],
        pain_point=row["pain_point"],
        issue_tree=json.loads(row["issue_tree"]),
        assumptions=json.loads(row["assumptions"]),
        perpetuations=json.loads(row["perpetuations"]),
        solutions=json.loads(row["solutions"]),
        fears=json.loads(row["fears"]),
        action_plan=row["action_plan"],
        ai_summary=json.loads(row["ai_summary"]) if row["ai_summary"] else None,
        summary_header=row["summary_header"]
    )

# AI Endpoints
@app.post("/api/ai/assist", response_model=AIAssistResponse)
async def ai_assist(request: AIAssistRequest, current_request: Request):
    """Get AI assistance for a specific stage of the session"""
    # Get current user
    current_user = get_current_user(current_request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate required fields
    if not request.sessionId or not request.stage or not request.sessionContext:
        raise HTTPException(status_code=400, detail="sessionId, stage, and sessionContext are required")
    
    # userInput can be empty for identify_assumptions stage
    if not request.userInput and request.stage != 'identify_assumptions':
        raise HTTPException(status_code=400, detail="userInput is required for this stage")
    
    try:
        result = await get_ai_response(
            user_id=current_user.id,
            session_id=request.sessionId,
            stage=request.stage,
            user_input=request.userInput,
            session_context=request.sessionContext
        )
        
        status_code = 200 if result["success"] else (429 if "Rate limit" in result.get("error", "") else 500)
        
        if status_code != 200:
            raise HTTPException(status_code=status_code, detail=result)
        
        return AIAssistResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "error": "Internal Server Error"})

@app.post("/api/ai/summary", response_model=AISummaryResponse)
async def ai_summary(request: AISummaryRequest, current_request: Request):
    """Generate AI summary for a completed session"""
    # Get current user
    current_user = get_current_user(current_request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate required fields
    if not request.sessionId or not request.sessionData:
        raise HTTPException(status_code=400, detail="sessionId and sessionData are required")
    
    try:
        result = await get_ai_summary(
            user_id=current_user.id,
            session_id=request.sessionId,
            session_data=request.sessionData,
            ai_interaction_log=request.aiInteractionLog or []
        )
        
        status_code = 200 if result["success"] else (429 if "Rate limit" in result.get("error", "") else 500)
        
        if status_code != 200:
            raise HTTPException(status_code=status_code, detail=result)
        
        return AISummaryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Summary generation error: {e}")
        raise HTTPException(status_code=500, detail={"success": False, "error": "Internal Server Error"})

@app.get("/api/ai/usage/{session_id}")
async def get_ai_usage(session_id: str, current_request: Request):
    """Get AI usage statistics for a session"""
    # Get current user
    current_user = get_current_user(current_request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Import the check_rate_limits function from ai_service
        from ai_service import check_rate_limits
        
        usage_data = await check_rate_limits(current_user.id, session_id)
        
        return {
            "dailyRequests": usage_data["dailyUsage"],
            "dailyLimit": usage_data["dailyLimit"],
            "sessionRequests": usage_data["sessionUsage"],
            "sessionLimit": usage_data["sessionLimit"],
            "stageUsageByStage": usage_data["stageUsageByStage"],
            "stageLimit": usage_data["stageLimit"]
        }
        
    except Exception as e:
        print(f"Usage check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get usage data")