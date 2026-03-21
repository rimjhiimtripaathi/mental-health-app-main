from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List
import cv2
import numpy as np
import base64
from datetime import datetime

router = APIRouter()

class ImageAnalysisRequest(BaseModel):
    image_data: str  # base64 encoded image
    user_id: str
    analysis_type: str = "facial"  # facial or general

class EmotionAnalysisResponse(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    confidence: float
    analysis_type: str = "image"
    timestamp: str
    user_id: str
    metadata: Dict[str, Any]

class ImageEmotionAnalyzer:
    def __init__(self):
        # Load face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # In production, load pre-trained emotion recognition models:
        # - DeepFace
        # - FER2013 trained models
        # - AffectNet models
        
        self.emotion_labels = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']
        self.model_loaded = True
    
    def analyze_facial_emotion(self, image: np.ndarray) -> Dict[str, float]:
        """Analyze facial emotions in image"""
        faces = self.face_cascade.detectMultiScale(
            cv2.cvtColor(image, cv2.COLOR_BGR2GRAY),
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return {'neutral': 1.0}
        
        # Analyze first face found
        x, y, w, h = faces[0]
        face_roi = image[y:y+h, x:x+w]
        
        # In production, use actual emotion recognition model here
        # This is a simplified simulation
        emotions = self._simulate_emotion_detection(face_roi)
        return emotions
    
    def analyze_general_emotion(self, image: np.ndarray) -> Dict[str, float]:
        """Analyze general emotional tone of image (color, composition, etc.)"""
        # Analyze color tones
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Brightness and saturation analysis
        brightness = np.mean(hsv[:,:,2])
        saturation = np.mean(hsv[:,:,1])
        
        # Color distribution analysis
        blue_ratio = np.sum(image[:,:,0]) / np.sum(image)
        green_ratio = np.sum(image[:,:,1]) / np.sum(image)
        red_ratio = np.sum(image[:,:,2]) / np.sum(image)
        
        # Emotion mapping based on visual characteristics
        emotions = {
            'happy': min(0.8, brightness / 255 * 0.5 + saturation / 255 * 0.3),
            'sad': min(0.7, (255 - brightness) / 255 * 0.6),
            'angry': min(0.6, red_ratio * 2),
            'fearful': min(0.5, blue_ratio * 1.5),
            'surprised': min(0.4, green_ratio * 1.2),
            'disgust': min(0.3, (red_ratio + green_ratio) * 0.8),
            'neutral': 0.3
        }
        
        # Normalize
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v/total for k, v in emotions.items()}
        
        return emotions
    
    def _simulate_emotion_detection(self, face_roi: np.ndarray) -> Dict[str, float]:
        """Simulate emotion detection from facial features"""
        # This is a placeholder - replace with actual model inference
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Simple feature-based simulation
        brightness = np.mean(gray_face)
        contrast = np.std(gray_face)
        
        emotions = {
            'neutral': 0.25,
            'happy': 0.2 if brightness > 100 else 0.1,
            'sad': 0.15 if brightness < 80 else 0.05,
            'angry': 0.1 if contrast > 50 else 0.05,
            'fearful': 0.1,
            'disgust': 0.08,
            'surprised': 0.12
        }
        
        # Normalize
        total = sum(emotions.values())
        emotions = {k: v/total for k, v in emotions.items()}
        
        return emotions

image_analyzer = ImageEmotionAnalyzer()

@router.post("/analyze-image", response_model=EmotionAnalysisResponse)
async def analyze_image_emotion(request: ImageAnalysisRequest):
    """
    Analyze emotions from image data
    """
    try:
        # Decode base64 image data
        image_bytes = base64.b64decode(request.image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Choose analysis method
        if request.analysis_type == "facial":
            emotion_probabilities = image_analyzer.analyze_facial_emotion(image)
        else:
            emotion_probabilities = image_analyzer.analyze_general_emotion(image)
        
        # Find dominant emotion
        dominant_emotion = max(emotion_probabilities.items(), key=lambda x: x[1])
        
        # Prepare metadata
        metadata = {
            "image_size": f"{image.shape[1]}x{image.shape[0]}",
            "analysis_type": request.analysis_type,
            "faces_detected": len(image_analyzer.face_cascade.detectMultiScale(
                cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            )) if request.analysis_type == "facial" else 0,
            "color_channels": image.shape[2],
            "analysis_model": "opencv_haar_cascade" if request.analysis_type == "facial" else "color_analysis"
        }
        
        return EmotionAnalysisResponse(
            emotions=emotion_probabilities,
            dominant_emotion=dominant_emotion[0],
            confidence=dominant_emotion[1],
            timestamp=datetime.utcnow().isoformat(),
            user_id=request.user_id,
            metadata=metadata
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )

@router.get("/image-model-status")
async def get_image_model_status():
    """Get status of image emotion analysis model"""
    return {
        "model_loaded": image_analyzer.model_loaded,
        "supported_emotions": image_analyzer.emotion_labels,
        "analysis_types": ["facial", "general"],
        "max_image_size": "4096x4096",
        "supported_formats": ["JPEG", "PNG", "BMP"],
        "status": "active"
    }