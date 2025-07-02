from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
from typing import List, Optional
from datetime import datetime

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "nuudle.db"

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

def create_table():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    # Drop the old table to apply schema changes
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
            summary_header TEXT
        )
    """)
    conn.commit()
    conn.close()

create_table()

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

@app.post("/api/sessions", response_model=SessionRead)
async def create_session(session: SessionCreate):
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
        INSERT INTO sessions (pain_point, issue_tree, assumptions, perpetuations, solutions, fears, action_plan, ai_summary, summary_header)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (session.pain_point, issue_tree_json, assumptions_json, perpetuations_json, solutions_json, fears_json, session.action_plan, ai_summary_json, summary_header))
    
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
def get_sessions():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
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
def get_session(session_id: int):
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
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