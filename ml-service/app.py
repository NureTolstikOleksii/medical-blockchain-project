from dotenv import load_dotenv
from pathlib import Path
import os


env_path = Path(__file__).resolve().parent / ".env"
print(">>> Loading env from:", env_path)
load_dotenv(dotenv_path=env_path, override=True)

print(">>> ENV CHECK:", os.getenv("LLM_API_URL"), os.getenv("LLM_API_KEY"))

from fastapi import FastAPI, Query
from schemas.patient import PatientData
from services.recommender import build_hybrid_recommendation

app = FastAPI(
    title="Health Hybrid ML+AI Recommendation Service",
    version="1.0.0",
)

app = FastAPI(
    title="Health Hybrid ML+AI Recommendation Service",
    version="1.1.0",
)

@app.post("/recommend-health")
async def recommend_health(payload: PatientData, mode: str = Query("patient")):
    """
    mode = "patient" → спрощений результат
    mode = "doctor" → повний результат
    """
    result = await build_hybrid_recommendation(payload, mode)
    return result