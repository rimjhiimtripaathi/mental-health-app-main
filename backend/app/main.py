from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.assessments import router as assessments_router
from app.api.endpoints.ai_analysis import router as ai_analysis_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.text_analysis import router as text_router

# Load environment variables
load_dotenv()

# Import routes
#from app.routes import auth, assessments

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health Companion API",
    description="AI-powered mental health monitoring and assessment platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(assessments_router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(ai_analysis_router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(text_router, prefix="/api/text", tags=["Text Analysis"])

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Mental Health Companion API",
        "version": "2.0.0",
        "status": "active",
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )