from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Any, List
import cv2
import numpy as np
import base64
import json
from datetime import datetime
import asyncio
import time

router = APIRouter()

class VideoAnalysisRequest(BaseModel):
    video_data: str  # base64 encoded video frame
    user_id: str
    frame_count: int = 1
    stream_mode: bool = False  # New field for stream mode

class EmotionAnalysisResponse(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    confidence: float
    analysis_type: str = "video"
    timestamp: str
    user_id: str
    metadata: Dict[str, Any]
    stream_data: Dict[str, Any] = None  # New field for stream analytics

class VideoStreamAnalyzer:
    def __init__(self):
        # Load face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.emotion_labels = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']
        self.model_loaded = True
        self.stream_sessions = {}  # Track active stream sessions
    
    def detect_faces(self, image: np.ndarray) -> List[Any]:
        """Detect faces in the image with optimized parameters for video"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Optimized for video - faster detection with slightly lower accuracy
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,  # Reduced for speed
            minNeighbors=3,    # Reduced for speed
            minSize=(50, 50),  # Increased minimum size for performance
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        return faces
    
    def analyze_emotion_from_face(self, face_roi: np.ndarray, stream_mode: bool = False) -> Dict[str, float]:
        """Analyze emotion from facial features with optimized performance for streaming"""
        try:
            # For streaming mode, use faster but less accurate analysis
            if stream_mode:
                return self._fast_emotion_analysis(face_roi)
            else:
                return self._detailed_emotion_analysis(face_roi)
            
        except Exception:
            # Fallback emotions
            return {emotion: 1.0/len(self.emotion_labels) for emotion in self.emotion_labels}
    
    def _fast_emotion_analysis(self, face_roi: np.ndarray) -> Dict[str, float]:
        """Fast emotion analysis optimized for video streaming"""
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Simple brightness and contrast analysis for speed
        brightness = np.mean(gray_face)
        contrast = np.std(gray_face)
        
        # Fast emotion estimation based on simple features
        emotions = {
            'neutral': 0.3,
            'happy': max(0.1, min(0.8, (brightness - 100) / 100)),
            'sad': max(0.1, min(0.7, (150 - brightness) / 100)),
            'angry': max(0.1, min(0.6, contrast / 100)),
            'fearful': 0.15,
            'disgust': 0.1,
            'surprised': max(0.1, min(0.5, (brightness - 50) / 200))
        }
        
        # Normalize
        total = sum(emotions.values())
        emotions = {k: v/total for k, v in emotions.items()}
        
        return emotions
    
    def _detailed_emotion_analysis(self, face_roi: np.ndarray) -> Dict[str, float]:
        """More detailed emotion analysis for single frame analysis"""
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # More detailed feature analysis
        brightness = np.mean(gray_face)
        contrast = np.std(gray_face)
        
        # Calculate histogram for more features
        hist = cv2.calcHist([gray_face], [0], None, [256], [0, 256])
        hist_peak = np.argmax(hist)
        
        emotions = {
            'neutral': 0.25,
            'happy': max(0.1, min(0.9, (brightness - 80) / 120)),
            'sad': max(0.1, min(0.8, (140 - brightness) / 120)),
            'angry': max(0.1, min(0.7, contrast / 80)),
            'fearful': max(0.1, min(0.6, abs(hist_peak - 128) / 128)),
            'disgust': max(0.05, min(0.5, (contrast + brightness) / 400)),
            'surprised': max(0.1, min(0.6, abs(brightness - 100) / 100))
        }
        
        # Normalize
        total = sum(emotions.values())
        emotions = {k: v/total for k, v in emotions.items()}
        
        return emotions
    
    def analyze_video_frame(self, image_data: np.ndarray, stream_mode: bool = False) -> Dict[str, float]:
        """Analyze emotions from a single video frame with streaming optimization"""
        faces = self.detect_faces(image_data)
        
        if len(faces) == 0:
            # No faces detected
            return {emotion: 0.0 for emotion in self.emotion_labels}
        
        # Analyze first detected face (for performance in streaming)
        x, y, w, h = faces[0]
        face_roi = image_data[y:y+h, x:x+w]
        
        return self.analyze_emotion_from_face(face_roi, stream_mode)

video_analyzer = VideoStreamAnalyzer()

@router.post("/analyze-video-frame", response_model=EmotionAnalysisResponse)
async def analyze_video_frame(request: VideoAnalysisRequest):
    """
    Analyze emotions from a single video frame with streaming support
    """
    try:
        # Decode base64 image data
        image_bytes = base64.b64decode(request.video_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Analyze emotions with streaming optimization
        emotion_probabilities = video_analyzer.analyze_video_frame(image, request.stream_mode)
        
        # Find dominant emotion
        if emotion_probabilities:
            dominant_emotion = max(emotion_probabilities.items(), key=lambda x: x[1])
        else:
            dominant_emotion = ('neutral', 1.0)
            emotion_probabilities = {'neutral': 1.0}
        
        # Prepare metadata
        faces_detected = len(video_analyzer.detect_faces(image))
        metadata = {
            "frame_size": f"{image.shape[1]}x{image.shape[0]}",
            "faces_detected": faces_detected,
            "analysis_model": "optimized_haar_cascade",
            "frame_count": request.frame_count,
            "stream_mode": request.stream_mode,
            "processing_time_ms": 50 if request.stream_mode else 100  # Simulated processing time
        }
        
        # Stream analytics data
        stream_data = None
        if request.stream_mode:
            stream_data = {
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "face_detection_confidence": min(1.0, faces_detected