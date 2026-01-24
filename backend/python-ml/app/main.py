"""
ElderNest AI - FastAPI ML Service
Main application entry point for risk prediction and emotion analysis.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from app.services.risk_predictor import RiskPredictor
from app.services.emotion_analyzer import EmotionAnalyzer

# Initialize FastAPI app
app = FastAPI(
    title="ElderNest ML Service",
    description="Machine Learning microservice for risk prediction and emotion analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
risk_predictor = RiskPredictor()
emotion_analyzer = EmotionAnalyzer()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pydantic Models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class MLFeatures(BaseModel):
    """Input features for risk prediction."""
    avgMoodScore: float = Field(..., ge=0, le=1, description="Average mood score (0-1)")
    medicineAdherence: float = Field(..., ge=0, le=1, description="Medicine adherence rate (0-1)")
    avgSentiment: float = Field(..., ge=-1, le=1, description="Average chat sentiment (-1 to 1)")
    inactivityDays: int = Field(..., ge=0, le=7, description="Days of inactivity (0-7)")
    missedMedicines: int = Field(..., ge=0, description="Number of missed medicines")
    negativeChatCount: int = Field(..., ge=0, description="Count of negative chats")


class RiskPredictionRequest(BaseModel):
    """Request body for risk prediction."""
    userId: str
    features: MLFeatures


class RiskFactor(BaseModel):
    """Individual risk factor."""
    factor: str
    value: float
    threshold: float
    description: str


class RiskPredictionResponse(BaseModel):
    """Response for risk prediction."""
    riskLevel: str  # 'safe', 'monitor', 'high'
    riskScore: float
    factors: List[RiskFactor]


class EmotionAnalysisRequest(BaseModel):
    """Request body for emotion analysis."""
    userId: str
    image: str  # Base64 encoded image


class EmotionAnalysisResponse(BaseModel):
    """Response for emotion analysis."""
    emotion: str
    confidence: float


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/", response_model=dict)
async def root():
    """Service information."""
    return {
        "name": "ElderNest ML Service",
        "version": "1.0.0",
        "description": "ML microservice for elderly care risk assessment",
        "endpoints": {
            "health": "/health",
            "risk_prediction": "/api/predict-risk",
            "emotion_analysis": "/api/analyze-emotion",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="ElderNest ML Service",
        version="1.0.0"
    )


@app.post("/api/predict-risk", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict risk level for an elder based on behavioral features.
    
    Returns risk level (safe/monitor/high), risk score, and contributing factors.
    """
    try:
        result = risk_predictor.predict(request.features.model_dump())
        return RiskPredictionResponse(
            riskLevel=result["riskLevel"],
            riskScore=result["riskScore"],
            factors=[RiskFactor(**f) for f in result["factors"]]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction failed: {str(e)}")


@app.post("/api/analyze-emotion", response_model=EmotionAnalysisResponse)
async def analyze_emotion(request: EmotionAnalysisRequest):
    """
    Analyze emotion from a facial image.
    
    Returns detected emotion and confidence score.
    """
    try:
        result = emotion_analyzer.analyze(request.image)
        return EmotionAnalysisResponse(
            emotion=result["emotion"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")


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
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug
    )
