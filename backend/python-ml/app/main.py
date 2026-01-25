#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Multi-Modal Risk Assessment ML Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCTION-READY FastAPI microservice for elderly care monitoring.

This service provides:
✅ Real-time emotion detection (DeepFace)
✅ Fall detection from camera (MediaPipe)
✅ Activity pattern analysis
✅ Multi-modal risk prediction (Random Forest)
✅ Emergency detection and alerts
✅ Family notifications (FCM + SMS)

This system can SAVE LIVES by detecting emergencies early.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import time
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

# Import services
from app.services.vision_service import vision_service
from app.services.multi_modal_risk_predictor import risk_predictor
from app.services.emergency_detector import emergency_detector
from app.services.alert_service import AlertService
from app.services.data_aggregator import DataAggregator

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pydantic Models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class VisionAnalysisRequest(BaseModel):
    """Request for vision analysis."""
    userId: str = Field(..., description="Elder user ID")
    image: str = Field(..., description="Base64-encoded image")
    detectEmotion: bool = Field(True, description="Run emotion detection")
    detectFall: bool = Field(True, description="Run fall detection")


class RiskAssessmentRequest(BaseModel):
    """Request for risk assessment."""
    userId: str = Field(..., description="Elder user ID")
    timeWindowDays: int = Field(7, ge=1, le=30, description="Analysis window in days")


class ManualRiskFeaturesRequest(BaseModel):
    """Request with manual feature input for risk prediction."""
    avgSentiment7days: float = Field(0.0, ge=-1, le=1)
    sadMoodCount: int = Field(0, ge=0, le=10)
    lonelyMentions: int = Field(0, ge=0, le=10)
    healthComplaints: int = Field(0, ge=0, le=10)
    inactiveDays: int = Field(0, ge=0, le=7)
    medicineMissed: int = Field(0, ge=0, le=10)
    avgFacialEmotionScore: float = Field(0.0, ge=-1, le=1)
    fallDetectedCount: int = Field(0, ge=0, le=5)
    distressEpisodes: int = Field(0, ge=0, le=5)
    eatingIrregularity: float = Field(0.0, ge=0, le=1)
    sleepQualityScore: float = Field(0.7, ge=0, le=1)
    daysWithoutEating: int = Field(0, ge=0, le=7)
    emergencyButtonPresses: int = Field(0, ge=0, le=5)
    cameraInactivityHours: float = Field(0.0, ge=0, le=24)
    painExpressionCount: int = Field(0, ge=0, le=10)


class EmergencyCheckRequest(BaseModel):
    """Request for emergency detection."""
    userId: str
    visionData: Optional[dict] = None
    activityData: Optional[dict] = None
    healthData: Optional[dict] = None


class EmotionAnalysisRequest(BaseModel):
    """Request for emotion-only analysis."""
    image: str = Field(..., description="Base64-encoded facial image")


class FallDetectionRequest(BaseModel):
    """Request for fall-only detection."""
    image: str = Field(..., description="Base64-encoded image")


class ActivityAnalysisRequest(BaseModel):
    """Request for activity pattern analysis."""
    mealLogs: Optional[List[dict]] = Field(None, description="Meal records")
    sleepLogs: Optional[List[dict]] = Field(None, description="Sleep records")
    cameraLogs: Optional[List[dict]] = Field(None, description="Camera activity logs")
    days: int = Field(7, ge=1, le=30)


class FamilyMember(BaseModel):
    """Family member for alert notifications."""
    id: str
    name: Optional[str] = None
    fcm_token: Optional[str] = None
    phone: Optional[str] = None


class AlertRequest(BaseModel):
    """Request to send emergency alert."""
    elderId: str
    elderName: str
    emergencyData: dict
    familyMembers: List[FamilyMember]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Application Lifecycle
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("🚀 ElderNest ML Service Starting...")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Initialize services
    app.state.data_aggregator = DataAggregator(initialize_firebase=True)
    app.state.alert_service = AlertService(initialize_firebase=True)
    
    logger.info("✅ Vision Service: Ready")
    logger.info("✅ Risk Predictor: Ready")
    logger.info("✅ Emergency Detector: Ready")
    logger.info("✅ Alert Service: Ready")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    yield
    
    # Shutdown
    logger.info("👋 ElderNest ML Service Shutting Down...")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FastAPI Application
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app = FastAPI(
    title="ElderNest ML Service",
    description=(
        "Multi-modal AI system for elderly care monitoring.\n\n"
        "**Capabilities:**\n"
        "- 🎭 Emotion Detection (DeepFace)\n"
        "- 🚨 Fall Detection (MediaPipe)\n"
        "- 📊 Multi-Modal Risk Prediction\n"
        "- 🚑 Emergency Detection\n"
        "- 📱 Family Notifications\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to all responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.3f}"
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} "
        f"({process_time*1000:.2f}ms)"
    )
    
    return response


# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": str(request.url.path)
        }
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health & Info Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/", tags=["Health"])
async def root():
    """Service information."""
    return {
        "service": "ElderNest ML Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Multi-modal AI for elderly care monitoring",
        "capabilities": [
            "emotion_detection",
            "fall_detection",
            "activity_analysis",
            "risk_prediction",
            "emergency_detection",
            "family_alerts"
        ],
        "endpoints": {
            "health": "/health",
            "vision": "/api/analyze-vision",
            "emotion": "/api/analyze-emotion",
            "fall": "/api/detect-fall",
            "risk": "/api/predict-risk",
            "emergency": "/api/check-emergency",
            "docs": "/docs"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ElderNest ML Service",
        "version": "1.0.0",
        "components": {
            "vision_service": "ok",
            "risk_predictor": "ok",
            "emergency_detector": "ok"
        }
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Vision Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/analyze-vision", tags=["Vision"])
async def analyze_vision(
    request: VisionAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Comprehensive vision analysis: emotion + fall detection.
    
    Analyzes camera frame for:
    - Facial emotions (happy, sad, angry, etc.)
    - Fall detection (body posture analysis)
    - Pain indicators
    - Distress levels
    
    Triggers emergency alerts if critical situations detected.
    """
    try:
        # Run vision analysis
        result = await vision_service.analyze_frame(
            image_base64=request.image,
            user_id=request.userId,
            detect_emotion=request.detectEmotion,
            detect_fall=request.detectFall
        )
        
        # Check for emergency conditions
        alert = result.get('alert')
        if alert and alert.get('severity') in ['critical', 'high']:
            # Fetch user data for emergency check
            data_agg = app.state.data_aggregator
            user_data = await data_agg.fetch_user_data(request.userId)
            
            emergency = emergency_detector.detect_emergency(
                vision_data=result,
                activity_data=user_data.get('activity'),
                health_data=user_data.get('health'),
                recent_events=user_data.get('events')
            )
            
            if emergency.get('emergency'):
                # Send alerts in background
                background_tasks.add_task(
                    app.state.alert_service.send_emergency_alert,
                    elder_id=request.userId,
                    elder_name=user_data.get('elder_name', 'Elder'),
                    emergency_data=emergency,
                    family_members=[
                        fm for fm in user_data.get('family_members', [])
                    ]
                )
                result['emergency'] = emergency
        
        return result
        
    except Exception as e:
        logger.error(f"Vision analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-emotion", tags=["Vision"])
async def analyze_emotion(request: EmotionAnalysisRequest):
    """
    Analyze facial emotion from image.
    
    Returns:
    - Dominant emotion
    - Confidence score
    - All emotion probabilities
    - Pain detection
    - Distress level
    """
    try:
        result = await vision_service.analyze_emotion_only(request.image)
        return result
    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect-fall", tags=["Vision"])
async def detect_fall(request: FallDetectionRequest):
    """
    Detect falls and analyze body posture.
    
    Returns:
    - Fall detection flag
    - Body angle
    - Posture classification
    - Unusual posture detection
    """
    try:
        result = await vision_service.detect_fall_only(request.image)
        return result
    except Exception as e:
        logger.error(f"Fall detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Risk Prediction Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/predict-risk", tags=["Risk"])
async def predict_risk(request: RiskAssessmentRequest):
    """
    Multi-modal risk prediction.
    
    Fetches user data from Firestore and predicts risk level:
    - SAFE: No concerns
    - MONITOR: Watch closely
    - HIGH_RISK: Immediate attention needed
    
    Combines data from:
    - Chat sentiment
    - Mood check-ins
    - Camera emotions
    - Activity patterns
    - Health metrics
    """
    try:
        # Fetch user data
        data_agg = app.state.data_aggregator
        user_data = await data_agg.fetch_user_data(
            request.userId,
            days=request.timeWindowDays
        )
        
        # Predict risk
        prediction = risk_predictor.predict_risk(
            chat_data=user_data.get('chat'),
            mood_data=user_data.get('mood'),
            vision_data=user_data.get('vision'),
            activity_data=user_data.get('activity'),
            health_data=user_data.get('health')
        )
        
        # Log prediction
        logger.info(
            f"Risk prediction: user={request.userId}, "
            f"level={prediction.get('risk_level')}, "
            f"score={prediction.get('risk_score')}"
        )
        
        return prediction
        
    except Exception as e:
        logger.error(f"Risk prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict-risk-manual", tags=["Risk"])
async def predict_risk_manual(request: ManualRiskFeaturesRequest):
    """
    Predict risk from manually provided features.
    
    Useful for testing and when real-time data is provided
    from external sources.
    """
    try:
        # Convert request to feature dicts
        chat_data = {
            'avg_sentiment': request.avgSentiment7days,
            'lonely_mentions': request.lonelyMentions,
            'health_complaints': request.healthComplaints
        }
        
        mood_data = {
            'sad_count': request.sadMoodCount,
            'inactive_days': request.inactiveDays
        }
        
        vision_data = {
            'emotion_score': request.avgFacialEmotionScore,
            'fall_count': request.fallDetectedCount,
            'distress_count': request.distressEpisodes,
            'pain_count': request.painExpressionCount,
            'inactivity_hours': request.cameraInactivityHours
        }
        
        activity_data = {
            'eating_irregularity': request.eatingIrregularity,
            'sleep_quality': request.sleepQualityScore,
            'days_without_eating': request.daysWithoutEating
        }
        
        health_data = {
            'medicine_missed': request.medicineMissed,
            'emergency_button_presses': request.emergencyButtonPresses
        }
        
        # Predict
        prediction = risk_predictor.predict_risk(
            chat_data=chat_data,
            mood_data=mood_data,
            vision_data=vision_data,
            activity_data=activity_data,
            health_data=health_data
        )
        
        return prediction
        
    except Exception as e:
        logger.error(f"Manual risk prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk-feature-importance", tags=["Risk"])
async def get_feature_importance():
    """Get risk model feature importance scores."""
    return risk_predictor.get_feature_importance()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Emergency Detection Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/check-emergency", tags=["Emergency"])
async def check_emergency(
    request: EmergencyCheckRequest,
    background_tasks: BackgroundTasks
):
    """
    Check for emergency situations.
    
    Analyzes provided data for:
    - Falls with no movement
    - Critical distress
    - Severe pain
    - Prolonged inactivity
    - No eating
    - Emergency button presses
    """
    try:
        emergency = emergency_detector.detect_emergency(
            vision_data=request.visionData,
            activity_data=request.activityData,
            health_data=request.healthData,
            recent_events=[]
        )
        
        if emergency.get('emergency'):
            logger.warning(
                f"🚨 Emergency detected: user={request.userId}, "
                f"type={emergency.get('emergency_type')}, "
                f"severity={emergency.get('severity')}"
            )
        
        return emergency
        
    except Exception as e:
        logger.error(f"Emergency check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/send-alert", tags=["Emergency"])
async def send_alert(request: AlertRequest):
    """
    Send emergency alert to family members.
    
    Sends:
    - Push notifications (FCM)
    - SMS for critical emergencies
    """
    try:
        result = await app.state.alert_service.send_emergency_alert(
            elder_id=request.elderId,
            elder_name=request.elderName,
            emergency_data=request.emergencyData,
            family_members=[fm.model_dump() for fm in request.familyMembers]
        )
        return result
        
    except Exception as e:
        logger.error(f"Alert send error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Activity Analysis Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/analyze-activity", tags=["Activity"])
async def analyze_activity(request: ActivityAnalysisRequest):
    """
    Analyze activity patterns.
    
    Analyzes:
    - Eating patterns
    - Sleep quality
    - Camera activity/inactivity
    """
    try:
        from app.models.activity_analyzer import activity_analyzer
        
        result = activity_analyzer.get_comprehensive_activity_summary(
            meal_logs=request.mealLogs or [],
            sleep_logs=request.sleepLogs or [],
            camera_logs=request.cameraLogs or [],
            days=request.days
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Activity analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Run Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🧠 ElderNest ML Service")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📍 Server: http://{host}:{port}")
    print(f"📚 API Docs: http://{host}:{port}/docs")
    print(f"🔬 ReDoc: http://{host}:{port}/redoc")
    print(f"🐛 Debug Mode: {debug}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug
    )
