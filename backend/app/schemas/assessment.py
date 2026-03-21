# backend/app/schemas/assessment.py
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class AssessmentBase(BaseModel):
    user_id: str
    assessment_type: str
    score: int
    assessment_data: Dict[str, Any] = {}  # Changed from 'metadata'

class AssessmentCreate(AssessmentBase):
    pass

class Assessment(AssessmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True