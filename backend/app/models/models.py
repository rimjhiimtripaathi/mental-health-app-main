from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums for different types
class AssessmentType(str, Enum):
    PHQ9 = "phq9"
    GAD7 = "gad7"
    WHO5 = "who5"

class EmotionLabel(str, Enum):
    ANGRY = "angry"
    DISGUST = "disgust"
    FEAR = "fear"
    HAPPY = "happy"
    NEUTRAL = "neutral"
    SAD = "sad"
    SURPRISE = "surprise"

# User models
class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    """Model for user registration"""
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """Model for user response (without sensitive data)"""
    user_id: str
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

# Assessment models
class AssessmentBase(BaseModel):
    """Base assessment model"""
    user_id: str
    assessment_type: AssessmentType
    score: int
    metadata: Optional[Dict[str, Any]] = None

class AssessmentCreate(AssessmentBase):
    """Model for creating new assessment"""
    pass

class AssessmentResponse(AssessmentBase):
    """Model for assessment response"""
    assessment_id: str
    created_at: datetime
    interpretation: Optional[str] = None
    
    class Config:
        from_attributes = True

# AI Analysis models
class AudioAnalysisRequest(BaseModel):
    """Model for audio analysis request"""
    audio_data: str  # Base64 encoded audio
    user_id: str

class VideoAnalysisRequest(BaseModel):
    """Model for video/image analysis request"""
    image_data: str  # Base64 encoded image
    user_id: str

class EmotionAnalysisResponse(BaseModel):
    """Model for emotion analysis response"""
    dominant_emotion: EmotionLabel
    confidence: float
    all_emotions: Dict[EmotionLabel, float]
    timestamp: datetime

# Token models
class Token(BaseModel):
    """Model for JWT token response"""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    """Model for token data"""
    user_id: Optional[str] = None
    email: Optional[str] = None