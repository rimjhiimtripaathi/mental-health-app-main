# backend/app/models/assessment.py
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.session import Base
import datetime
import json

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    assessment_type = Column(String, nullable=False)  # 'phq9', 'gad7', 'who5'
    score = Column(Integer, nullable=False)
    assessment_data = Column(Text)  # Changed from 'metadata' to avoid reserved name conflict
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def set_assessment_data(self, data):
        """Helper method to store JSON data"""
        self.assessment_data = json.dumps(data)

    def get_assessment_data(self):
        """Helper method to retrieve JSON data"""
        if self.assessment_data:
            return json.loads(self.assessment_data)
        return {}

    def to_dict(self):
        """Convert assessment to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "assessment_type": self.assessment_type,
            "score": self.score,
            "assessment_data": self.get_assessment_data(),
            "created_at": self.created_at
        }