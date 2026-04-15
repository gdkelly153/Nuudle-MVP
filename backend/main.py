from fastapi import FastAPI, HTTPException, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from bson import ObjectId
import pytz

# Load environment variables - handle both local and production environments
load_dotenv()

# Import database functions - hybrid import for local/production compatibility
try:
    from backend.database import connect_to_mongo, close_mongo_connection, get_database
except ImportError:
    from database import connect_to_mongo, close_mongo_connection, get_database

# Import AI service functions - hybrid import for local/production compatibility
try:
    from backend.ai_service import get_ai_response, get_ai_summary, analyze_self_awareness, generate_action_options, refine_action, get_next_action_planning_question, get_next_cause_analysis_question, get_fear_analysis_options, get_riddle_question_response, evaluate_riddle_solution_with_ai, get_claude_response, triage_classify_input, semantic_match_component, verify_solution, analyze_puzzle_submission
except ImportError:
    from ai_service import get_ai_response, get_ai_summary, analyze_self_awareness, generate_action_options, refine_action, get_next_action_planning_question, get_next_cause_analysis_question, get_fear_analysis_options, get_riddle_question_response, evaluate_riddle_solution_with_ai, get_claude_response, triage_classify_input, semantic_match_component, verify_solution, analyze_puzzle_submission
# Import riddle models - hybrid import for local/production compatibility
try:
    from backend.models import DailyRiddle, RiddleSession, RiddleQuestion, DailyScenario, ScenarioSession, ScenarioDecision
except ImportError:
    from models import DailyRiddle, RiddleSession, RiddleQuestion, DailyScenario, ScenarioSession, ScenarioDecision

# Import scheduler - hybrid import for local/production compatibility
try:
    from backend.scheduler import start_scheduler, stop_scheduler, generate_riddle_now, generate_puzzle_now
    from backend.riddle_generator import generate_and_store_daily_riddle
    from backend.puzzle_generator import generate_and_store_daily_puzzle
except ImportError:
    from scheduler import start_scheduler, stop_scheduler, generate_riddle_now, generate_puzzle_now
    from riddle_generator import generate_and_store_daily_riddle
    from puzzle_generator import generate_and_store_daily_puzzle

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
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002"
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

class AISelfAwarenessRequest(BaseModel):
    causes: List[str]

class AISelfAwarenessResponse(BaseModel):
    success: bool
    selfAwarenessDetected: Optional[bool] = None
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

class AdaptiveCauseAnalysisRequest(BaseModel):
    cause: str
    history: List[str] = []
    painPoint: str = ""
    regenerate: bool = False

class AdaptiveCauseAnalysisResponse(BaseModel):
    success: bool
    next_question: Optional[str] = None
    is_complete: bool = False
    root_cause_options: Optional[List[str]] = []
    error: Optional[str] = None

class CauseAnalysisRequest(BaseModel):
    session_id: str
    cause: str
    history: List[str] = []
    regenerate: bool = False

class CauseAnalysisResponse(BaseModel):
    success: bool
    response: str
    is_complete: bool = False
    root_cause_options: Optional[List[str]] = []
    error: Optional[str] = None

class ActionPlanRequest(BaseModel):
    session_id: str
    cause: str
    isContribution: bool = False
    history: List[str] = []
    regenerate: bool = False
    include_session_context: bool = True
    frontend_session_context: Optional[Dict[str, Any]] = None
    generation_count: int = 0
    existing_plans: Optional[List[str]] = None
    pain_point: Optional[str] = None
    cause_analysis_history: Optional[List[Dict[str, str]]] = None

class ActionPlanResponse(BaseModel):
    success: bool
    response: str
    is_complete: bool = False
    action_plan_options: Optional[List[str]] = []
    error: Optional[str] = None

class ActionPlanningRequest(BaseModel):
    cause: str
    isContribution: bool = False
    userResponses: List[str] = []
    context: str = "action_planning"

class ActionPlanningResponse(BaseModel):
    success: bool
    actionOptions: Optional[List[Dict[str, str]]] = []
    error: Optional[str] = None

class ActionRefinementRequest(BaseModel):
    initialAction: str
    cause: str
    userFeedback: str = ""

class ActionRefinementResponse(BaseModel):
    success: bool
    refinedAction: Optional[str] = None
    error: Optional[str] = None

class FearAnalysisRequest(BaseModel):
    mitigation_plan: str
    fear_context: Optional[Dict[str, Any]] = None

class FearAnalysisResponse(BaseModel):
    success: bool
    mitigation_options: Optional[List[str]] = []
    contingency_options: Optional[List[str]] = []
    error: Optional[str] = None

# Session Models
class Fear(BaseModel):
    name: str
    mitigation: str
    contingency: str

class IssueTree(BaseModel):
    primary_cause: str
    sub_causes: List[str]

class SessionCreate(BaseModel):
    session_type: str = "problem-solver"
    pain_point: Optional[str] = None
    causes: Optional[List[str]] = []
    assumptions: Optional[List[str]] = []
    perpetuations: Optional[List[str]] = []
    solutions: Optional[List[str]] = []
    fears: Optional[List[Fear]] = []
    action_plan: Optional[str] = None
    ai_summary: Optional[dict] = None
    # Fields for other session types
    riddle_id: Optional[str] = None
    scenario_id: Optional[str] = None


class SessionRead(BaseModel):
    id: str
    created_at: str
    session_type: str
    pain_point: Optional[str] = None
    issue_tree: Optional[IssueTree] = None
    assumptions: Optional[List[str]] = []
    perpetuations: Optional[List[str]] = []
    solutions: Optional[List[str]] = []
    fears: Optional[List[Fear]] = []
    action_plan: Optional[str] = None
    ai_summary: Optional[dict] = None
    summary_header: Optional[str] = None
    riddle_id: Optional[str] = None
    puzzle_id: Optional[str] = None
    scenario_id: Optional[str] = None

class UnifiedSessionCreate(BaseModel):
    session_type: str
    user_id: str
    riddle_id: Optional[str] = None
    puzzle_id: Optional[str] = None
    scenario_id: Optional[str] = None

# Analytics Models
class AnalyticsEvent(BaseModel):
    eventName: str
    payload: Dict[str, Any]
    userId: str
    timestamp: str

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
    """Initialize database connection and scheduler on application startup"""
    await connect_to_mongo()
    # Start the scheduler for daily content generation
    start_scheduler()
    
    # Generate daily content on startup if it doesn't exist for today
    # This ensures content is available immediately after server restart
    await generate_riddle_now(force_overwrite=False)
    await generate_puzzle_now(force_overwrite=False)
    
    print("✓ Application startup complete with scheduler running")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection and stop scheduler on application shutdown"""
    stop_scheduler()
    await close_mongo_connection()
    print("✓ Application shutdown complete")

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
    summary_header = extract_summary_header(session.ai_summary, session.pain_point or "")
    
    # Create the issue_tree structure only if causes are present
    issue_tree = None
    if session.causes:
        issue_tree = IssueTree(
            primary_cause=session.causes[0] if session.causes else "",
            sub_causes=session.causes[1:]
        )

    # Create session document
    session_doc = {
        "created_at": datetime.utcnow(),
        "session_type": session.session_type,
        "pain_point": session.pain_point,
        "issue_tree": issue_tree.model_dump() if issue_tree else None,
        "assumptions": session.assumptions,
        "perpetuations": session.perpetuations,
        "solutions": session.solutions,
        "fears": [fear.model_dump() for fear in session.fears] if session.fears else [],
        "action_plan": session.action_plan,
        "ai_summary": session.ai_summary,
        "summary_header": summary_header,
        "user_id": user_id,
        "riddle_id": session.riddle_id,
        "scenario_id": session.scenario_id,
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    return SessionRead(
        id=session_id,
        created_at=session_doc["created_at"].isoformat(),
        session_type=session.session_type,
        pain_point=session.pain_point,
        issue_tree=issue_tree,
        assumptions=session.assumptions,
        perpetuations=session.perpetuations,
        solutions=session.solutions,
        fears=session.fears,
        action_plan=session.action_plan,
        ai_summary=session.ai_summary,
        summary_header=summary_header,
        riddle_id=session.riddle_id,
        scenario_id=session.scenario_id,
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
                session_type=session_doc.get("session_type", "problem-solver"),
                pain_point=session_doc.get("pain_point", "No pain point recorded"),
                issue_tree=IssueTree(**session_doc.get("issue_tree")) if session_doc.get("issue_tree") else None,
                assumptions=session_doc.get("assumptions", []),
                perpetuations=session_doc.get("perpetuations", []),
                solutions=session_doc.get("solutions", []),
                fears=[Fear(**fear) for fear in session_doc.get("fears", [])],
                action_plan=session_doc.get("action_plan", ""),
                ai_summary=session_doc.get("ai_summary"),
                summary_header=session_doc.get("summary_header"),
                riddle_id=session_doc.get("riddle_id"),
                scenario_id=session_doc.get("scenario_id"),
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
        session_type=session_doc.get("session_type", "problem-solver"),
        pain_point=session_doc["pain_point"],
        issue_tree=IssueTree(**session_doc["issue_tree"]) if session_doc.get("issue_tree") else None,
        assumptions=session_doc["assumptions"],
        perpetuations=session_doc["perpetuations"],
        solutions=session_doc["solutions"],
        fears=[Fear(**fear) for fear in session_doc["fears"]],
        action_plan=session_doc["action_plan"],
        ai_summary=session_doc.get("ai_summary"),
        summary_header=session_doc.get("summary_header"),
        riddle_id=session_doc.get("riddle_id"),
        scenario_id=session_doc.get("scenario_id"),
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

@app.post("/api/v1/sessions/{session_id}/causes/analyze", response_model=CauseAnalysisResponse)
async def analyze_cause(session_id: str, request: CauseAnalysisRequest, current_user: User = Depends(get_current_user)):
    """
    Analyzes a single cause through a multi-step process.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not request.cause:
        raise HTTPException(status_code=400, detail="Cause cannot be empty")

    try:
        result = await get_ai_response(
            user_id=current_user.id,
            session_id=session_id,
            stage="conversational_cause_analysis",
            user_input="", # Not used in the new flow
            session_context={"cause": request.cause, "history": request.history, "regenerate": request.regenerate}
        )

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "AI service failed"))

        return CauseAnalysisResponse(
            success=True,
            response=result["response"],
            is_complete=result.get("is_complete", False),
            root_cause_options=result.get("root_cause_options", [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/sessions/{session_id}/actions/plan", response_model=ActionPlanResponse)
async def plan_action(session_id: str, request: ActionPlanRequest, current_request: Request):
    """
    Plans actions for a single cause through a multi-step conversation process.
    Now enhanced with full session context for better personalization.
    """
    # Get current user (optional for now to maintain compatibility)
    current_user = await get_current_user(current_request)
    
    if not request.cause:
        raise HTTPException(status_code=400, detail="Cause cannot be empty")

    try:
        # Use frontend session context if provided, otherwise try to fetch from database
        session_context = None
        if request.frontend_session_context:
            session_context = request.frontend_session_context
            print(f"Action planning - Using frontend session context: {session_context}")
        elif request.include_session_context:
            try:
                db = get_database()
                object_id = ObjectId(session_id)
                session_doc = await db.sessions.find_one({"_id": object_id})
                if session_doc:
                    session_context = {
                        "pain_point": session_doc.get("pain_point", ""),
                        "causes": session_doc.get("issue_tree", {}).get("primary_cause", "") +
                                 (", " + ", ".join(session_doc.get("issue_tree", {}).get("sub_causes", [])) if session_doc.get("issue_tree", {}).get("sub_causes") else ""),
                        "assumptions": session_doc.get("assumptions", []),
                        "perpetuations": session_doc.get("perpetuations", []),
                        "solutions": session_doc.get("solutions", [])
                    }
                    print(f"Action planning - Using database session context: {session_context}")
            except Exception as e:
                print(f"Warning: Could not fetch session context: {e}")
                # Continue without session context rather than fail

        result = await get_next_action_planning_question(
            cause=request.cause,
            history=request.history,
            is_contribution=request.isContribution,
            regenerate=request.regenerate,
            session_context=session_context,
            generation_count=request.generation_count,
            existing_plans=request.existing_plans,
            pain_point=request.pain_point,
            cause_analysis_history=request.cause_analysis_history
        )

        return ActionPlanResponse(
            success=True,
            response=result.get("response", ""),
            is_complete=result.get("is_complete", False),
            action_plan_options=result.get("action_plan_options", [])
        )

    except Exception as e:
        print(f"Action planning error: {e}")
        return ActionPlanResponse(
            success=False,
            response="",
            error=str(e)
        )

# Voice Endpoints
@app.post("/api/v1/voice/synthesize")
async def voice_synthesize():
    # This endpoint will handle text-to-speech requests.
    # It should be prepared to integrate with ElevenLabs (as primary)
    # and Azure Cognitive Services (as fallback).
    return {"message": "Synthesize endpoint"}

@app.post("/api/v1/voice/transcribe")
async def voice_transcribe():
    # This endpoint will handle speech-to-text requests from audio file uploads.
    return {"message": "Transcribe endpoint"}

@app.get("/api/v1/voice/personalities")
async def voice_personalities():
    # This endpoint will return a list of available voice profiles.
    return {"personalities": ["Sarah", "James"]}

# AI Endpoints
@app.post("/api/ai/assist", response_model=AIAssistResponse)
async def ai_assist(request: AIAssistRequest, current_request: Request):
    """Get AI assistance for a specific stage of the session"""
    # Get current user (optional for compatibility)
    current_user = await get_current_user(current_request)
    user_id = current_user.id if current_user else "anonymous"
    
    # Validate required fields
    if not request.sessionId or not request.stage or not request.sessionContext:
        raise HTTPException(status_code=400, detail="sessionId, stage, and sessionContext are required")
    
    # userInput can be empty for identify_assumptions stage
    if not request.userInput and request.stage != 'identify_assumptions':
        raise HTTPException(status_code=400, detail="userInput is required for this stage")
    
    try:
        result = await get_ai_response(
            user_id=user_id,
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
    # Get current user (optional for compatibility)
    current_user = await get_current_user(current_request)
    user_id = current_user.id if current_user else "anonymous"
    
    try:
        # Import the check_rate_limits function from ai_service - hybrid import
        try:
            from backend.ai_service import check_rate_limits
        except ImportError:
            from ai_service import check_rate_limits
        
        usage_data = await check_rate_limits(user_id, session_id)
        
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

@app.post("/api/ai/analyze-self-awareness", response_model=AISelfAwarenessResponse)
async def analyze_self_awareness_endpoint(request: AISelfAwarenessRequest):
    """Analyze if user's submitted causes demonstrate self-awareness"""
    try:
        result = await analyze_self_awareness(request.causes)
        
        return AISelfAwarenessResponse(**result)
        
    except Exception as e:
        print(f"Self-awareness analysis error: {e}")
        return AISelfAwarenessResponse(
            success=False,
            error="Failed to analyze self-awareness"
        )

@app.post("/api/ai/plan-action", response_model=ActionPlanningResponse)
async def plan_action(request: ActionPlanningRequest):
    """Generate action options based on cause analysis and user responses"""
    try:
        if not request.cause.strip():
            return ActionPlanningResponse(
                success=False,
                error="Cause cannot be empty"
            )
        
        # Use AI service to generate action options
        action_options = await generate_action_options(
            cause=request.cause,
            is_contribution=request.isContribution,
            user_responses=request.userResponses
        )
        
        return ActionPlanningResponse(
            success=True,
            actionOptions=action_options
        )
        
    except Exception as e:
        print(f"Action planning error: {e}")
        return ActionPlanningResponse(
            success=False,
            error=f"Action planning failed: {str(e)}"
        )

@app.post("/api/ai/refine-action", response_model=ActionRefinementResponse)
async def refine_action_endpoint(request: ActionRefinementRequest):
    """Refine an action based on user feedback"""
    try:
        if not request.initialAction.strip() or not request.cause.strip():
            return ActionRefinementResponse(
                success=False,
                error="Action and cause are required"
            )
        
        # Use AI service to refine the action
        refined_action = await refine_action(
            initial_action=request.initialAction,
            cause=request.cause,
            user_feedback=request.userFeedback
        )
        
        return ActionRefinementResponse(
            success=True,
            refinedAction=refined_action
        )
        
    except Exception as e:
        print(f"Action refinement error: {e}")
        return ActionRefinementResponse(
            success=False,
            error=f"Action refinement failed: {str(e)}"
        )

@app.post("/api/ai/adaptive-cause-analysis", response_model=AdaptiveCauseAnalysisResponse)
async def adaptive_cause_analysis(request: AdaptiveCauseAnalysisRequest):
    """
    New adaptive root cause analysis endpoint using the Root Cause Litmus Test
    """
    try:
        if not request.cause.strip():
            return AdaptiveCauseAnalysisResponse(
                success=False,
                error="Cause cannot be empty"
            )
        
        # Use the new adaptive cause analysis function
        result = await get_next_cause_analysis_question(
            cause=request.cause,
            history=request.history,
            pain_point=request.painPoint,
            regenerate=request.regenerate
        )
        
        if result.get("is_complete", False):
            # Analysis is complete - return root cause options
            return AdaptiveCauseAnalysisResponse(
                success=True,
                is_complete=True,
                root_cause_options=result.get("root_cause_options", [])
            )
        else:
            # Continue conversation - return next question
            return AdaptiveCauseAnalysisResponse(
                success=True,
                next_question=result.get("next_question", "Could you tell me more about that?"),
                is_complete=False
            )
        
    except Exception as e:
        print(f"Adaptive cause analysis error: {e}")
        return AdaptiveCauseAnalysisResponse(
            success=False,
            error=f"Adaptive cause analysis failed: {str(e)}"
        )

@app.post("/api/ai/fear-analysis", response_model=FearAnalysisResponse)
async def fear_analysis(request: FearAnalysisRequest, current_request: Request):
    """
    Generate mitigation and contingency options for fear analysis
    """
    # Get current user (optional for compatibility)
    current_user = await get_current_user(current_request)
    
    try:
        if not request.mitigation_plan.strip():
            return FearAnalysisResponse(
                success=False,
                error="Mitigation plan cannot be empty"
            )
        
        # Use the new fear analysis function
        result = await get_fear_analysis_options(
            mitigation_plan=request.mitigation_plan,
            fear_context=request.fear_context or {}
        )
        
        return FearAnalysisResponse(
            success=True,
            mitigation_options=result.get("mitigation_options", []),
            contingency_options=result.get("contingency_options", [])
        )
        
    except Exception as e:
        print(f"Fear analysis error: {e}")
        return FearAnalysisResponse(
            success=False,
            error=f"Fear analysis failed: {str(e)}"
        )
# Riddle Endpoints
class DailyRiddleResponse(BaseModel):
    id: str
    riddle_text: str
    date: str
    is_solved: bool = False
    solved_session_id: Optional[str] = None

@app.get("/api/v1/riddles/daily")
async def get_daily_riddle(request: Request):
    """Fetches the current day's riddle (Pacific timezone) with solved status."""
    db = get_database()
    current_user = await get_current_user(request)
    
    # Get today's date in Pacific Time (handles PST/PDT automatically)
    pacific_tz = pytz.timezone('America/Los_Angeles')
    now_pacific = datetime.now(pacific_tz)
    today = now_pacific.strftime("%Y-%m-%d")
    
    riddle = await db.riddles.find_one({"date": today})
    
    if not riddle:
        # No riddle exists for today - this should only happen if the scheduler hasn't run yet
        # Return an error to indicate the riddle isn't ready
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Today's riddle is not yet available",
                "message": "The daily riddle is generated at midnight Pacific Time. Please check back soon!",
                "date": today
            }
        )
    
    # Check if user has solved today's riddle
    is_solved = False
    solved_session_id = None
    
    if current_user:
        # Look for a solved session for this riddle and user
        solved_session = await db.sessions.find_one({
            "session_type": "daily-riddle",
            "user_id": current_user.id,
            "riddle_id": str(riddle["_id"]),
            "solved": True
        })
        
        if solved_session:
            is_solved = True
            solved_session_id = str(solved_session["_id"])
    else:
        # For anonymous users, check localStorage key (handled on frontend)
        # We'll return the riddle info and let frontend handle the solved state
        pass
    
    return DailyRiddleResponse(
        id=str(riddle["_id"]),
        riddle_text=riddle["riddle_text"],
        date=riddle["date"],
        is_solved=is_solved,
        solved_session_id=solved_session_id
    )

@app.post("/api/v1/riddles/generate-now")
async def generate_riddle_manually():
    """
    Manual endpoint to trigger riddle generation.
    Useful for testing or manual generation.
    """
    try:
        await generate_riddle_now()
        return {"success": True, "message": "Riddle generation triggered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Puzzle Endpoints
class DailyPuzzleResponse(BaseModel):
    id: str
    puzzle_text: str
    date: str
    is_solved: bool = False
    solved_session_id: Optional[str] = None
    total_components: int = 0
    puzzle_components: Optional[List[str]] = []

@app.get("/api/v1/puzzles/daily")
async def get_daily_puzzle(request: Request):
    """Fetches the current day's lateral thinking puzzle (Pacific timezone) with solved status."""
    db = get_database()
    current_user = await get_current_user(request)
    
    # Get today's date in Pacific Time (handles PST/PDT automatically)
    pacific_tz = pytz.timezone('America/Los_Angeles')
    now_pacific = datetime.now(pacific_tz)
    today = now_pacific.strftime("%Y-%m-%d")
    
    puzzle = await db.puzzles.find_one({"date": today})
    
    if not puzzle:
        # No puzzle exists for today - this should only happen if the scheduler hasn't run yet
        # Return an error to indicate the puzzle isn't ready
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Today's puzzle is not yet available",
                "message": "The daily puzzle is generated at midnight Pacific Time. Please check back soon!",
                "date": today
            }
        )
    
    # Check if user has solved today's puzzle
    is_solved = False
    solved_session_id = None
    
    if current_user:
        # Look for a solved session for this puzzle and user
        solved_session = await db.sessions.find_one({
            "session_type": "daily-puzzle",
            "user_id": current_user.id,
            "puzzle_id": str(puzzle["_id"]),
            "solved": True
        })
        
        if solved_session:
            is_solved = True
            solved_session_id = str(solved_session["_id"])
    else:
        # For anonymous users, check localStorage key (handled on frontend)
        # We'll return the puzzle info and let frontend handle the solved state
        pass
    
    return DailyPuzzleResponse(
        id=str(puzzle["_id"]),
        puzzle_text=puzzle["puzzle_text"],
        date=puzzle["date"],
        is_solved=is_solved,
        solved_session_id=solved_session_id,
        total_components=len(puzzle.get("puzzle_components", [])),
        puzzle_components=puzzle.get("puzzle_components", [])
    )

@app.post("/api/v1/puzzles/generate-now")
async def generate_puzzle_manually():
    """
    Manual endpoint to trigger puzzle generation.
    Useful for testing or manual generation.
    """
    try:
        result = await generate_and_store_daily_puzzle(force_overwrite=True)
        return {"success": True, "message": "Puzzle generation triggered", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This endpoint is now replaced by the unified /api/v1/sessions endpoint
# class RiddleSessionCreate(BaseModel):
#     user_id: str
#     riddle_id: str

# @app.post("/api/v1/riddles/sessions", response_model=RiddleSession)
# async def create_riddle_session(session_data: RiddleSessionCreate):
#     """Creates a new session for a user to solve a riddle."""
#     db = get_database()
#     session = RiddleSession(user_id=session_data.user_id, riddle_id=session_data.riddle_id)
#     await db.riddle_sessions.insert_one(session.model_dump())
#     return session

class RiddleQuestionRequest(BaseModel):
    question_text: str

class RiddleQuestionResponse(BaseModel):
    response: str  # "Yes" or "No"

class RiddleSubmissionRequest(BaseModel):
    submission_text: str

class RiddleSubmissionResponse(BaseModel):
    submission_type: str
    response: str
    is_correct: Optional[bool] = None
    reasoning: Optional[str] = None
    solved_components: Optional[List[int]] = []
    total_components: Optional[int] = 0
    solved_component_texts: Optional[List[str]] = []
    full_solution: Optional[str] = None

@app.post("/api/v1/riddles/sessions/{session_id}/question", response_model=RiddleQuestionResponse)
async def process_riddle_question(session_id: str, request: RiddleQuestionRequest):
    """Processes a user's yes/no question about the riddle using AI."""
    db = get_database()
    
    # Get the session to find the riddle_id
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        riddle_id = session.get("riddle_id")
        if not riddle_id:
            raise HTTPException(status_code=400, detail="No riddle associated with this session")
        
        # Get the riddle to find the solution
        # Note: riddle_id might be stored as a string (UUID) or ObjectId, so try both
        riddle = await db.riddles.find_one({"_id": riddle_id}) if isinstance(riddle_id, str) else await db.riddles.find_one({"_id": ObjectId(riddle_id)})
        
        # If not found by _id, try finding by date (for daily riddles)
        if not riddle:
            from datetime import datetime
            today = datetime.utcnow().strftime("%Y-%m-%d")
            riddle = await db.riddles.find_one({"date": today})
        
        if not riddle:
            raise HTTPException(status_code=404, detail="Riddle not found")
        
        # Use AI to determine the response
        ai_result = await get_riddle_question_response(
            question=request.question_text,
            riddle_solution=riddle["solution"]
        )
        
        return RiddleQuestionResponse(response=ai_result["response"])
        
    except Exception as e:
        print(f"Error processing riddle question: {e}")
        # Fallback to "No" if something goes wrong (never return "Irrelevant")
        return RiddleQuestionResponse(response="No")

class RiddleSolutionRequest(BaseModel):
    solution_text: str

class RiddleSolutionResponse(BaseModel):
    correct: bool

@app.post("/api/v1/riddles/sessions/{session_id}/solution", response_model=RiddleSolutionResponse)
async def evaluate_riddle_solution(session_id: str, request: RiddleSolutionRequest):
    """Evaluates a user's proposed solution to the riddle using AI for semantic matching."""
    db = get_database()
    
    try:
        # Get session
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        riddle_id = session.get("riddle_id")
        if not riddle_id:
            raise HTTPException(status_code=400, detail="No riddle associated with this session")

        # Get riddle - try multiple lookup methods
        riddle = None
        if isinstance(riddle_id, str):
            # Try as string UUID first
            riddle = await db.riddles.find_one({"_id": riddle_id})
            if not riddle:
                # Try as ObjectId
                try:
                    riddle = await db.riddles.find_one({"_id": ObjectId(riddle_id)})
                except:
                    pass
        
        # Fallback: try finding by today's date
        if not riddle:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            riddle = await db.riddles.find_one({"date": today})
        
        if not riddle:
            raise HTTPException(status_code=404, detail="Riddle not found")

        # Use AI to evaluate the solution semantically
        evaluation = await evaluate_riddle_solution_with_ai(
            user_answer=request.solution_text,
            correct_solution=riddle["solution"]
        )
        
        print(f"Solution evaluation: {evaluation}")
        
        return RiddleSolutionResponse(correct=evaluation["is_correct"])
        
    except Exception as e:
        print(f"Error evaluating riddle solution: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate solution")

@app.post("/api/v1/riddles/sessions/{session_id}/submit", response_model=RiddleSubmissionResponse)
async def process_riddle_submission(session_id: str, request: RiddleSubmissionRequest):
    """
    SINGLE-ANSWER SYSTEM: Simple correctness check
    
    Step 1: Check if submission is a correct statement/question about the riddle
    Step 2: Verify if the submission is the complete correct answer
    """
    db = get_database()
    
    try:
        # Get session and riddle
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        riddle_id = session.get("riddle_id")
        if not riddle_id:
            raise HTTPException(status_code=400, detail="No riddle associated with this session")

        # Get riddle - try multiple lookup methods
        riddle = None
        if isinstance(riddle_id, str):
            riddle = await db.riddles.find_one({"_id": riddle_id})
            if not riddle:
                try:
                    riddle = await db.riddles.find_one({"_id": ObjectId(riddle_id)})
                except:
                    pass
        
        if not riddle:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            riddle = await db.riddles.find_one({"date": today})
        
        if not riddle:
            raise HTTPException(status_code=404, detail="Riddle not found")

        submission_text = request.submission_text.strip()
        solution = riddle.get("solution", "")
        
        print(f"\n=== PROCESSING SUBMISSION ===")
        print(f"User Input: '{submission_text}'")
        print(f"Solution: '{solution}'")
        
        # STEP 1: CHECK IF IT'S A CORRECT STATEMENT/QUESTION
        print(f"\n[STEP 1: GENERAL QUESTION CHECK]")
        
        correctness_result = await get_riddle_question_response(
            question=submission_text,
            riddle_solution=solution
        )
        
        is_statement_correct = correctness_result["response"] == "Yes"
        
        print(f"  Statement Correct: {is_statement_correct}")
        print(f"  Response: {correctness_result['response']}")
        
        # STEP 2: VERIFICATION - Check if complete solution is correct
        print(f"\n[STEP 2: SOLUTION VERIFICATION]")
        
        verification_result = await verify_solution(
            submission_text,
            solution,
            [],  # No components in single-answer system
            []   # No solved components
        )
        
        is_correct = verification_result.get("is_correct", False)
        
        print(f"  Is Correct: {is_correct}")
        print(f"  Reasoning: {verification_result.get('reasoning', '')}")
        
        # Determine final response
        if is_correct:
            # Mark the session as completely solved
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {
                    "solved": True,
                    "solved_at": datetime.utcnow()
                }}
            )
            
            print(f"\n[RIDDLE SOLVED]: Session marked as complete")
            
            return RiddleSubmissionResponse(
                submission_type="solution",
                response="Correct!",
                is_correct=True,
                reasoning=verification_result.get("reasoning"),
                full_solution=solution
            )
            
        elif is_statement_correct:
            print(f"\n[CORRECT STATEMENT]: Statement is correct")
            return RiddleSubmissionResponse(
                submission_type="question",
                response="Yes",
                is_correct=None
            )
            
        else:
            # Statement is not correct
            if submission_text.strip().endswith("?"):
                response_text = "No"
            else:
                response_text = "Incorrect"
            
            print(f"\n[INCORRECT]: Statement is not correct")
            print(f"\n=== SUBMISSION COMPLETE ===\n")
            
            return RiddleSubmissionResponse(
                submission_type="question",
                response=response_text,
                is_correct=None
            )
        
    except Exception as e:
        print(f"Error processing riddle submission: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process submission")

@app.post("/api/v1/puzzles/sessions/{session_id}/submit", response_model=RiddleSubmissionResponse)
async def process_puzzle_submission(session_id: str, request: RiddleSubmissionRequest):
    """
    Phase 2: Simplified puzzle submission processing using single AI analysis.
    
    Uses the new analyze_puzzle_submission function for context-aware, intelligent responses.
    """
    db = get_database()
    
    try:
        # Get session and puzzle
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        puzzle_id = session.get("puzzle_id")
        if not puzzle_id:
            raise HTTPException(status_code=400, detail="No puzzle associated with this session")

        # Get puzzle - try multiple lookup methods
        puzzle = None
        if isinstance(puzzle_id, str):
            puzzle = await db.puzzles.find_one({"_id": puzzle_id})
            if not puzzle:
                try:
                    puzzle = await db.puzzles.find_one({"_id": ObjectId(puzzle_id)})
                except:
                    pass
        
        if not puzzle:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            puzzle = await db.puzzles.find_one({"date": today})
        
        if not puzzle:
            raise HTTPException(status_code=404, detail="Puzzle not found")

        submission_text = request.submission_text.strip()
        solution = puzzle.get("solution", "")
        puzzle_components = puzzle.get("puzzle_components", [])
        solution_context = puzzle.get("solution_context", [])
        
        # Get solved components and conversation history from session
        solved_components = session.get("solved_components", [])
        conversation_history = session.get("conversation_history", [])
        
        print(f"\n=== PROCESSING PUZZLE SUBMISSION (Phase 2) ===")
        print(f"User Input: '{submission_text}'")
        print(f"Solution: '{solution}'")
        print(f"Total Components: {len(puzzle_components)}")
        print(f"Solved Components: {solved_components}")
        
        # Extract component texts for analysis
        component_texts = []
        for comp in puzzle_components:
            if isinstance(comp, dict):
                component_texts.append(comp.get("component_text", ""))
            else:
                component_texts.append(str(comp))
        
        # Use the new single AI analysis function
        analysis_result = await analyze_puzzle_submission(
            user_input=submission_text,
            puzzle_solution=solution,
            solution_components=component_texts,
            solution_context=solution_context,
            solved_components=solved_components,
            conversation_history=conversation_history
        )
        
        print(f"\n[AI ANALYSIS RESULT]")
        print(f"  Response Type: {analysis_result.get('response_type')}")
        print(f"  Message: {analysis_result.get('message')}")
        print(f"  Reasoning: {analysis_result.get('reasoning')}")
        
        # Update conversation history
        conversation_history.append({"role": "user", "text": submission_text})
        conversation_history.append({"role": "assistant", "text": analysis_result.get("message", "")})
        
        # Handle response based on type
        response_type = analysis_result.get("response_type")
        
        if response_type == "component_discovered":
            # Component discovery - update session
            component_index = analysis_result.get("component_index")
            if component_index is not None and component_index not in solved_components:
                solved_components.append(component_index)
                await db.sessions.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": {
                        "solved_components": solved_components,
                        "conversation_history": conversation_history
                    }}
                )
            
            # Get icon/keyword for this component
            icon_keyword = None
            if component_index is not None and isinstance(puzzle_components[component_index], dict):
                icon_keyword = puzzle_components[component_index].get("icon_keyword")
            
            print(f"\n[COMPONENT DISCOVERED]: Index {component_index}")
            
            return RiddleSubmissionResponse(
                submission_type="component_discovered",
                response=analysis_result.get("message", "You discovered a clue!"),
                is_correct=None,
                solved_components=solved_components,
                total_components=len(puzzle_components),
                solved_component_texts=[component_texts[i] for i in solved_components]
            )
            
        elif response_type == "solution_correct":
            # Complete solution - mark as solved
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {
                    "solved": True,
                    "solved_at": datetime.utcnow(),
                    "solved_components": list(range(len(puzzle_components))),
                    "conversation_history": conversation_history
                }}
            )
            
            print(f"\n[PUZZLE SOLVED]: Session marked as complete")
            
            return RiddleSubmissionResponse(
                submission_type="solution",
                response=analysis_result.get("message", "Correct!"),
                is_correct=True,
                reasoning=analysis_result.get("reasoning"),
                full_solution=solution,
                solved_components=list(range(len(puzzle_components))),
                total_components=len(puzzle_components)
            )
            
        elif response_type == "statement_correct":
            # Correct statement/question
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"conversation_history": conversation_history}}
            )
            
            print(f"\n[CORRECT STATEMENT]")
            
            return RiddleSubmissionResponse(
                submission_type="question",
                response=analysis_result.get("message", "Yes"),
                is_correct=None,
                solved_components=solved_components,
                total_components=len(puzzle_components)
            )
            
        else:  # statement_incorrect
            # Incorrect statement/question
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"conversation_history": conversation_history}}
            )
            
            print(f"\n[INCORRECT STATEMENT]")
            print(f"\n=== PUZZLE SUBMISSION COMPLETE ===\n")
            
            return RiddleSubmissionResponse(
                submission_type="question",
                response=analysis_result.get("message", "No"),
                is_correct=None,
                solved_components=solved_components,
                total_components=len(puzzle_components)
            )
        
    except Exception as e:
        print(f"Error processing puzzle submission: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to process submission")

# Scenario Endpoints
@app.get("/api/v1/scenarios/daily", response_model=DailyScenario)
async def get_daily_scenario():
    """Fetches the current day's scenario."""
    db = get_database()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    scenario = await db.scenarios.find_one({"date": today})
    if not scenario:
        # If no scenario for today, create a placeholder
        placeholder_scenario = {
            "title": "The Quantum Entanglement",
            "briefing": "You are a physicist on the verge of a breakthrough in quantum communication. An anomaly has been detected in your experiment, and you must decide how to proceed. Your choices will determine the future of this technology.",
            "checkpoints": {
                "start": {
                    "narrative": "The anomaly flashes across your screen, a wave of impossible data. Your heart pounds. This could be everything you've worked for, or it could be a catastrophic failure.",
                    "options": {
                        "A": "Immediately isolate the quantum processor to prevent potential damage.",
                        "B": "Run a deep diagnostic to understand the anomaly's source.",
                        "C": "Push more power to the processor to amplify the signal and gather more data."
                    }
                }
            },
            "date": today,
        }
        await db.scenarios.insert_one(placeholder_scenario)
        scenario = await db.scenarios.find_one({"date": today})

    return DailyScenario(**scenario)

class ScenarioDecisionRequest(BaseModel):
    checkpoint_id: str
    decision: str

class ScenarioDecisionResponse(BaseModel):
    success: bool
    narrative_state: dict

@app.post("/api/v1/scenarios/sessions/{session_id}/decision", response_model=ScenarioDecisionResponse)
async def process_scenario_decision(session_id: str, request: ScenarioDecisionRequest):
    """Processes a user's decision at a specific checkpoint in the narrative."""
    db = get_database()
    session = await db.scenario_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # In a real implementation, this would involve complex logic to update the narrative_state
    # based on the decision and the scenario's branching logic.
    # For now, we'll just record the decision.
    decision = ScenarioDecision(
        session_id=session_id,
        checkpoint_id=request.checkpoint_id,
        decision=request.decision
    )
    await db.scenario_decisions.insert_one(decision.model_dump())

    # Update the session's narrative state (placeholder logic)
    new_narrative_state = {"last_decision": request.decision}
    await db.scenario_sessions.update_one(
        {"id": session_id},
        {"$set": {"narrative_state": new_narrative_state}}
    )

    return ScenarioDecisionResponse(success=True, narrative_state=new_narrative_state)

class ScenarioQuestionRequest(BaseModel):
    question_text: str

class ScenarioQuestionResponse(BaseModel):
    response: str

@app.post("/api/v1/scenarios/sessions/{session_id}/question", response_model=ScenarioQuestionResponse)
async def process_scenario_question(session_id: str, request: ScenarioQuestionRequest):
    """Allows the user to ask for more information to inform their decisions."""
    # In a real implementation, this would use an AI service to generate a response.
    # For now, we'll return a placeholder response.
    return ScenarioQuestionResponse(response="That's a good question. I'll have to get back to you on that.")

@app.post("/api/v1/sessions", response_model=SessionRead)
async def create_unified_session(session_data: UnifiedSessionCreate, request: Request):
    """Creates a new session for any module type."""
    db = get_database()
    
    # Get current user (optional for now to maintain compatibility)
    current_user = await get_current_user(request)
    user_id = current_user.id if current_user else session_data.user_id
    
    session_doc = {
        "created_at": datetime.utcnow(),
        "session_type": session_data.session_type,
        "user_id": user_id,
        "riddle_id": session_data.riddle_id,
        "puzzle_id": session_data.puzzle_id,
        "scenario_id": session_data.scenario_id,
        # Initialize other fields as needed
        "pain_point": None,
        "issue_tree": None,
        "assumptions": [],
        "perpetuations": [],
        "solutions": [],
        "fears": [],
        "action_plan": None,
        "ai_summary": None,
        "summary_header": None,
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    # Fetch the created document to return it
    created_session = await db.sessions.find_one({"_id": result.inserted_id})
    
    return SessionRead(
        id=session_id,
        created_at=created_session["created_at"].isoformat(),
        session_type=created_session["session_type"],
        user_id=created_session["user_id"],
        riddle_id=created_session.get("riddle_id"),
        puzzle_id=created_session.get("puzzle_id"),
        scenario_id=created_session.get("scenario_id"),
    )

# Analytics Endpoints
@app.post("/api/v1/analytics/track")
async def track_analytics_event(event: AnalyticsEvent):
    """Tracks an analytics event."""
    db = get_database()
    
    event_doc = {
        "event_name": event.eventName,
        "payload": event.payload,
        "user_id": event.userId,
        "timestamp": datetime.fromisoformat(event.timestamp.replace("Z", "+00:00")),
    }
    
    await db.analytics_events.insert_one(event_doc)
    
    return {"success": True, "message": "Event tracked successfully"}