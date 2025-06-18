from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "nuudle.db"

class Session(BaseModel):
    id: int = None
    pain_point: str
    whys: List[str]
    action_plan: str

def create_table():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pain_point TEXT,
            whys TEXT,
            action_plan TEXT
        )
    """)
    conn.commit()
    conn.close()

create_table()

@app.post("/api/sessions", response_model=Session)
def create_session(session: Session):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (pain_point, whys, action_plan)
        VALUES (?, ?, ?)
    """, (session.pain_point, ",".join(session.whys), session.action_plan))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Session(id=session_id, pain_point=session.pain_point, whys=session.whys, action_plan=session.action_plan)

@app.get("/api/sessions", response_model=List[Session])
def get_sessions():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, pain_point, whys, action_plan FROM sessions ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    sessions = []
    for row in rows:
        id, pain_point, whys, action_plan = row
        sessions.append(Session(id=id, pain_point=pain_point, whys=whys.split(","), action_plan=action_plan))
    return sessions