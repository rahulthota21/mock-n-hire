from pydantic import BaseModel
from typing import List, Optional, Dict

class Question(BaseModel):
    text: str
    category: str

class StressAnalysis(BaseModel):
    score: float
    level: str
    individual_scores: List[float]

class NextQuestionResponse(BaseModel):
    status: str
    question: str
    category: str
    question_number: int
    total_questions: int

class AverageStressResponse(BaseModel):
    status: str
    session_id: str
    average_stress: float
    average_stress_level: str
    individual_scores: List[float]

class QuestionReport(BaseModel):
    question_number: int
    question_text: str
    category: str
    answer_text: Optional[str] = None
    audio_url: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    stress_score: Optional[float] = None
    stress_level: Optional[str] = None

class FinalReportResponse(BaseModel):
    session_id: str
    questions: List[QuestionReport]
    average_stress: float
    average_stress_level: str
    overall_summary: str
    final_score: float
    recommendation: str

class SessionStats(BaseModel):
    session_id: str
    created_at: str
    average_stress: float
    average_answer_score: Optional[float] = None
    questions_attempted: int
    total_questions: int

class UserSummaryResponse(BaseModel):
    mock_user_id: str
    total_sessions: int
    average_stress_trend: List[float]
    weakest_question_types: Dict[str, float]
    progress_over_time: Dict[str, float]

class Session(BaseModel):
    id: str
    user_id: str
    resume_id: str
    created_at: str