# backend/app/api/endpoints/assessments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from datetime import datetime

from app.db.session import get_db
from app.models.assessment import Assessment
from app.schemas.assessment import AssessmentCreate, Assessment as AssessmentSchema

router = APIRouter()

@router.post("/submit", response_model=AssessmentSchema)
async def submit_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db)
):
    """
    Submit assessment results
    """
    try:
        # Ensure assessment_data is properly formatted
        assessment_data = assessment.assessment_data
        
        # Convert assessment_data to JSON string for SQLite storage
        assessment_data_json = json.dumps(assessment_data)
        
        db_assessment = Assessment(
            user_id=assessment.user_id,
            assessment_type=assessment.assessment_type,
            score=assessment.score,
            assessment_data=assessment_data_json,
            created_at=datetime.utcnow()
        )
        
        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)
        
        # Convert back to dict for response
        response_data = db_assessment.to_dict()
        
        return response_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving assessment: {str(e)}")

@router.get("/user/{user_id}", response_model=List[AssessmentSchema])
async def get_user_assessments(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all assessments for a specific user
    """
    try:
        assessments = db.query(Assessment).filter(Assessment.user_id == user_id).order_by(Assessment.created_at.desc()).all()
        
        # Convert each assessment to dict with proper JSON parsing
        assessment_list = []
        for assessment in assessments:
            assessment_dict = assessment.to_dict()
            
            # Ensure assessment_data is properly parsed
            if isinstance(assessment_dict.get('assessment_data'), str):
                try:
                    assessment_dict['assessment_data'] = json.loads(assessment_dict['assessment_data'])
                except json.JSONDecodeError:
                    # If JSON parsing fails, keep the string or set to empty dict
                    assessment_dict['assessment_data'] = {}
            
            assessment_list.append(assessment_dict)
        
        return assessment_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving assessments: {str(e)}")

@router.get("/user/{user_id}/{assessment_type}", response_model=List[AssessmentSchema])
async def get_user_assessments_by_type(
    user_id: str,
    assessment_type: str,
    db: Session = Depends(get_db)
):
    """
    Get specific assessment type results for a user
    """
    try:
        assessments = db.query(Assessment).filter(
            Assessment.user_id == user_id,
            Assessment.assessment_type == assessment_type
        ).order_by(Assessment.created_at.desc()).all()
        
        # Convert each assessment to dict with proper JSON parsing
        assessment_list = []
        for assessment in assessments:
            assessment_dict = assessment.to_dict()
            
            # Ensure assessment_data is properly parsed
            if isinstance(assessment_dict.get('assessment_data'), str):
                try:
                    assessment_dict['assessment_data'] = json.loads(assessment_dict['assessment_data'])
                except json.JSONDecodeError:
                    assessment_dict['assessment_data'] = {}
            
            assessment_list.append(assessment_dict)
        
        return assessment_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving assessments: {str(e)}")

@router.get("/{assessment_id}", response_model=AssessmentSchema)
async def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific assessment by ID
    """
    try:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        assessment_dict = assessment.to_dict()
        
        # Ensure assessment_data is properly parsed
        if isinstance(assessment_dict.get('assessment_data'), str):
            try:
                assessment_dict['assessment_data'] = json.loads(assessment_dict['assessment_data'])
            except json.JSONDecodeError:
                assessment_dict['assessment_data'] = {}
        
        return assessment_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving assessment: {str(e)}")

@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a specific assessment
    """
    try:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        db.delete(assessment)
        db.commit()
        
        return {"message": "Assessment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting assessment: {str(e)}")