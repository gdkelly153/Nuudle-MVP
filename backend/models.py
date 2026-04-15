from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class RiddleQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    question_text: str
    response: str  # "Yes", "No", or "Irrelevant"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RiddleSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    riddle_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    questions: List[RiddleQuestion] = []
    solution_attempts: List[str] = []
    solved_components: List[int] = []  # Indices of solved components
    status: str = "ongoing"  # "ongoing", "solved", "abandoned"

class SolutionComponent(BaseModel):
    component_text: str
    icon_keyword: Optional[str] = None  # Icon or keyword for visual representation
    is_solved: bool = False

class DailyRiddle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    riddle_text: str
    solution: str
    puzzle_components: Optional[List[SolutionComponent]] = []
    solution_context: Optional[List[str]] = []
    date: str  # YYYY-MM-DD
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScenarioDecision(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    checkpoint_id: str
    decision: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ScenarioSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scenario_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    narrative_state: dict = {}
    decisions: List[ScenarioDecision] = []
    status: str = "ongoing"  # "ongoing", "completed", "abandoned"

class DailyScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    briefing: str
    checkpoints: dict  # JSON-like structure for narrative branching
    date: str  # YYYY-MM-DD
    created_at: datetime = Field(default_factory=datetime.utcnow)