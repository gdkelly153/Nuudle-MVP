from fastapi import FastAPI, HTTPException, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from bson import ObjectId

# Load environment variables - handle both local and production environments
try:
    load_dotenv(dotenv_path="backend/.env")  # Local development (from project root)
except:
    load_dotenv(dotenv_path=".env")  # Production fallback

# Import database functions - hybrid import for local/production compatibility
try:
    from backend.database import connect_to_mongo, close_mongo_connection, get_database
except ImportError:
    from database import connect_to_mongo, close_mongo_connection, get_database

# Import AI service functions - hybrid import for local/production compatibility
try:
    from backend.ai_service import get_ai_response, get_ai_summary
except ImportError:
    from ai_service import get_ai_response, get_ai_summary

app = FastAPI()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_for_development_only")
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

# Authentication Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
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
    forceGuidance: Optional[bool] = False

class AIAssistResponse(BaseModel):
    success: bool
    interactionId: Optional[str] = None
    response: Optional[str] = None
    cost: Optional[float] = None
    tokensUsed: Optional[int] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    fallback: Optional[str] = None

class AIValidateRequest(BaseModel):
    problemStatement: str

class AIValidateResponse(BaseModel):
    success: bool
    isValid: Optional[bool] = None
    reason: Optional[str] = None
    error: Optional[str] = None

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

class SessionRead(BaseModel):
    id: str
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

# Database helper functions
async def get_user_by_email(email: str):
    """Get user by email from MongoDB"""
    db = get_database()
    user = await db.users.find_one({"email": email})
    return user

async def create_user(email: str, password: str):
    """Create new user in MongoDB"""
    hashed_password = get_password_hash(password)
    db = get_database()
    
    # Check if user already exists
    existing_user = await get_user_by_email(email)
    if existing_user:
        return None
    
    user_doc = {
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)

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

async def get_current_user(request: Request):
    """Get current user from JWT token"""
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
    
    user = await get_user_by_email(email)
    if user is None:
        return None
    
    return User(id=str(user["_id"]), email=user["email"])

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on application startup"""
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on application shutdown"""
    await close_mongo_connection()

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
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        return AuthResponse(success=False, error="Email already registered")
    
    # Create new user
    user_id = await create_user(user_data.email, user_data.password)
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
    user = await get_user_by_email(user_data.email)
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
    
    user_obj = User(id=str(user["_id"]), email=user["email"])
    return AuthResponse(success=True, user=user_obj)

@app.get("/api/auth/status", response_model=AuthResponse)
async def auth_status(request: Request):
    user = await get_current_user(request)
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
    current_user = await get_current_user(request)
    user_id = current_user.id if current_user else None
    
    db = get_database()
    
    # Extract summary header from AI summary or create fallback
    summary_header = extract_summary_header(session.ai_summary, session.pain_point)
    
    # Create the issue_tree structure
    issue_tree = IssueTree(
        primary_cause=session.causes[0] if session.causes else "",
        sub_causes=session.causes[1:]
    )

    # Create session document
    session_doc = {
        "created_at": datetime.utcnow(),
        "pain_point": session.pain_point,
        "issue_tree": issue_tree.model_dump(),
        "assumptions": session.assumptions,
        "perpetuations": session.perpetuations,
        "solutions": session.solutions,
        "fears": [fear.model_dump() for fear in session.fears],
        "action_plan": session.action_plan,
        "ai_summary": session.ai_summary,
        "summary_header": summary_header,
        "user_id": user_id
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    return SessionRead(
        id=session_id,
        created_at=session_doc["created_at"].isoformat(),
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
async def get_sessions(request: Request):
    # Get current user (optional for now to maintain compatibility)
    current_user = await get_current_user(request)
    
    db = get_database()
    
    # If user is authenticated, show only their sessions; otherwise show all
    if current_user:
        cursor = db.sessions.find({"user_id": current_user.id}).sort("created_at", -1)
    else:
        cursor = db.sessions.find({}).sort("created_at", -1)
    
    sessions = []
    async for session_doc in cursor:
        # Skip documents without a valid _id (defensive programming for migration issues)
        if not session_doc.get("_id"):
            print(f"Skipping session document without _id: {session_doc}")
            continue
            
        try:
            sessions.append(SessionRead(
                id=str(session_doc["_id"]),
                created_at=session_doc.get("created_at", datetime.utcnow()).isoformat(),
                pain_point=session_doc.get("pain_point", "No pain point recorded"),
                issue_tree=IssueTree(**session_doc.get("issue_tree", {"primary_cause": "", "sub_causes": []})),
                assumptions=session_doc.get("assumptions", []),
                perpetuations=session_doc.get("perpetuations", []),
                solutions=session_doc.get("solutions", []),
                fears=[Fear(**fear) for fear in session_doc.get("fears", [])],
                action_plan=session_doc.get("action_plan", ""),
                ai_summary=session_doc.get("ai_summary"),
                summary_header=session_doc.get("summary_header")
            ))
        except Exception as e:
            print(f"Skipping malformed session document {session_doc.get('_id')}: {e}")
            continue
    
    return sessions

@app.get("/api/sessions/{session_id}", response_model=SessionRead)
async def get_session(session_id: str, request: Request):
    current_user = await get_current_user(request)
    
    db = get_database()
    
    try:
        object_id = ObjectId(session_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    # If user is authenticated, ensure they can only access their own sessions
    if current_user:
        session_doc = await db.sessions.find_one({"_id": object_id, "user_id": current_user.id})
    else:
        session_doc = await db.sessions.find_one({"_id": object_id})
    
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionRead(
        id=str(session_doc["_id"]),
        created_at=session_doc["created_at"].isoformat(),
        pain_point=session_doc["pain_point"],
        issue_tree=IssueTree(**session_doc["issue_tree"]),
        assumptions=session_doc["assumptions"],
        perpetuations=session_doc["perpetuations"],
        solutions=session_doc["solutions"],
        fears=[Fear(**fear) for fear in session_doc["fears"]],
        action_plan=session_doc["action_plan"],
        ai_summary=session_doc.get("ai_summary"),
        summary_header=session_doc.get("summary_header")
    )

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, request: Request):
    """Delete a session"""
    current_user = await get_current_user(request)
    
    db = get_database()
    
    try:
        object_id = ObjectId(session_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    # If user is authenticated, ensure they can only delete their own sessions
    if current_user:
        result = await db.sessions.delete_one({"_id": object_id, "user_id": current_user.id})
    else:
        result = await db.sessions.delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True, "message": "Session deleted successfully"}

# AI Endpoints
@app.post("/api/ai/assist", response_model=AIAssistResponse)
async def ai_assist(request: AIAssistRequest, current_request: Request):
    """Get AI assistance for a specific stage of the session"""
    # Get current user
    current_user = await get_current_user(current_request)
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
            session_context=request.sessionContext,
            force_guidance=request.forceGuidance
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
    current_user = await get_current_user(current_request)
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
    current_user = await get_current_user(current_request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Import the check_rate_limits function from ai_service - hybrid import
        try:
            from backend.ai_service import check_rate_limits
        except ImportError:
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

@app.post("/api/ai/validate-problem", response_model=AIValidateResponse)
async def validate_problem(request: AIValidateRequest):
    """Validate if a problem statement is well-articulated using AI"""
    try:
        # Import the validate_problem_statement function from ai_service - hybrid import
        try:
            from backend.ai_service import validate_problem_statement
        except ImportError:
            from ai_service import validate_problem_statement
        
        result = await validate_problem_statement(request.problemStatement)
        
        return AIValidateResponse(**result)
        
    except Exception as e:
        print(f"Problem validation error: {e}")
        return AIValidateResponse(
            success=False,
            error="Failed to validate problem statement"
        )