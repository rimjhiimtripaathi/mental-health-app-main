import base64
import tempfile
import torch
from datetime import datetime
from PIL import Image
import numpy as np
from io import BytesIO

from app.models.models import EmotionAnalysisResponse, EmotionLabel

class AIAnalysisService:
    """Service class for AI-powered emotion analysis"""
    
    # Emotion labels mapping
    EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    
    def __init__(self):
        """Initialize AI models"""
        self.audio_model = None
        self.video_processor = None
        self.video_model = None
        self._load_models()
    
    def _load_models(self):
        """Load AI models for emotion analysis"""
        try:
            from transformers import pipeline, AutoImageProcessor, AutoModelForImageClassification
            
            # Load audio model
            self.audio_model = pipeline(
                "audio-classification", 
                model="superb/wav2vec2-base-superb-er"
            )
            
            # Load video/image model
            model_name = "dima806/facial_emotions_image_detection"
            self.video_processor = AutoImageProcessor.from_pretrained(model_name)
            self.video_model = AutoModelForImageClassification.from_pretrained(model_name)
            self.video_model.eval()
            
            print("✅ AI models loaded successfully")
            
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
    
    def analyze_audio_emotion(self, audio_data: str, user_id: str) -> EmotionAnalysisResponse:
        """
        Analyze emotions from audio data
        
        Args:
            audio_data: Base64 encoded audio data
            user_id: ID of the user making the request
            
        Returns:
            EmotionAnalysisResponse: Analysis results with emotions and confidence scores
        """
        if not self.audio_model:
            raise Exception("Audio model not available")
        
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name
            
            # Analyze emotion
            results = self.audio_model(tmp_path)
            
            # Process results
            dominant_emotion = results[0][0]['label']
            confidence = results[0][0]['score']
            
            # Convert to standardized emotion labels
            all_emotions = {
                EmotionLabel(result['label']): result['score'] 
                for result in results[0][:5]  # Top 5 emotions
            }
            
            return EmotionAnalysisResponse(
                dominant_emotion=EmotionLabel(dominant_emotion),
                confidence=confidence,
                all_emotions=all_emotions,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            raise Exception(f"Audio analysis failed: {str(e)}")
    
    def analyze_video_emotion(self, image_data: str, user_id: str) -> EmotionAnalysisResponse:
        """
        Analyze emotions from image/video frame
        
        Args:
            image_data: Base64 encoded image data
            user_id: ID of the user making the request
            
        Returns:
            EmotionAnalysisResponse: Analysis results with emotions and confidence scores
        """
        if not self.video_processor or not self.video_model:
            raise Exception("Video model not available")
        
        try:
            # Decode base64 image data
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Preprocess image
            inputs = self.video_processor(images=image, return_tensors="pt")
            
            # Run inference
            with torch.no_grad():
                outputs = self.video_model(**inputs)
                probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
                confidence, prediction = torch.max(probabilities, 1)
            
            # Get emotion results
            emotion_index = prediction.item()
            dominant_emotion = self.EMOTION_LABELS[emotion_index]
            confidence_score = confidence.item()
            
            # Get all emotion probabilities
            all_emotions = {
                EmotionLabel(self.EMOTION_LABELS[i]): prob.item()
                for i, prob in enumerate(probabilities[0])
            }
            
            return EmotionAnalysisResponse(
                dominant_emotion=EmotionLabel(dominant_emotion),
                confidence=confidence_score,
                all_emotions=all_emotions,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            raise Exception(f"Video analysis failed: {str(e)}")

# Global instance
ai_service = AIAnalysisService()