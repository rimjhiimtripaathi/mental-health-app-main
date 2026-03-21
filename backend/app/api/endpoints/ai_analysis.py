from fastapi import APIRouter, HTTPException, status
from app.models.models import AudioAnalysisRequest, VideoAnalysisRequest, EmotionAnalysisResponse
from app.services.ai_analysis_service import ai_service

router = APIRouter()

@router.post("/analyze-audio", response_model=EmotionAnalysisResponse)
async def analyze_audio_emotion(request: AudioAnalysisRequest):
    """
    Analyze emotions from audio data
    
    Args:
        request: Audio analysis request with base64 audio data
        
    Returns:
        EmotionAnalysisResponse: Analysis results with emotion probabilities
    """
    try:
        result = ai_service.analyze_audio_emotion(request.audio_data, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio analysis failed: {str(e)}"
        )

@router.post("/analyze-video", response_model=EmotionAnalysisResponse)
async def analyze_video_emotion(request: VideoAnalysisRequest):
    """
    Analyze emotions from image/video data
    
    Args:
        request: Video analysis request with base64 image data
        
    Returns:
        EmotionAnalysisResponse: Analysis results with emotion probabilities
    """
    try:
        result = ai_service.analyze_video_emotion(request.image_data, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )

@router.get("/models-status")
async def get_models_status():
    """
    Get status of AI models
    
    Returns:
        dict: Status of loaded AI models
    """
    return {
        "audio_model_loaded": ai_service.audio_model is not None,
        "video_model_loaded": ai_service.video_processor is not None and ai_service.video_model is not None,
        "status": "active"
    }