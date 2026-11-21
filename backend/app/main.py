
from pathlib import Path
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.data.loader import (
    check_dataset,
    load_transactions,
    get_dataset_summary
)
from app.ml.predict import predict_fraud
from app.ml.explainability import explain_prediction
from app.api.transactions import router as transactions_router

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SUMMARY_PATH = PROJECT_ROOT / "data" / "processed" / "analytics_summary.json"

app = FastAPI(
    title="TraceON API",
    description="AI-Powered Financial Fraud Intelligence and Investigation Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Transaction monitor routes
app.include_router(
    transactions_router,
    prefix="/api/v1",
    tags=["Transactions"]
)

@app.get("/")
def home():
    return {
        "project": "TraceON",
        "message": "Fraud Intelligence API is running",
        "status": "online"
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TraceON Backend",
        "version": "1.0.0"
    }

@app.get("/api/v1/dashboard/summary")
def dashboard_summary():
    return {
        "transactions_analyzed": 0,
        "fraud_detected": 0,
        "amount_at_risk": 0,
        "detection_accuracy": 0,
        "data_status": "awaiting_dataset"
    }

@app.get("/api/v1/data/status")
def dataset_status():
    return get_dataset_summary()

@app.get("/api/v1/data/preview")
def dataset_preview(limit: int = 10):
    if not check_dataset():
        return {"loaded": False, "message": "PaySim dataset not found"}

    limit = max(1, min(limit, 100))
    df = load_transactions(nrows=limit)

    return {
        "loaded": True,
        "rows_returned": len(df),
        "data": df.to_dict(orient="records")
    }

@app.get("/api/v1/analytics/summary")
def analytics_summary():
    if not SUMMARY_PATH.exists():
        return {
            "available": False,
            "message": "Analytics summary not generated yet."
        }

    with open(SUMMARY_PATH, "r", encoding="utf-8") as file:
        return {
            "available": True,
            "analytics": json.load(file)
        }

@app.post("/api/v1/predict")
def predict_transaction(transaction: dict):
    try:
        return predict_fraud(transaction)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

@app.post("/api/v1/explain")
def explain_transaction(transaction: dict):
    try:
        return explain_prediction(transaction)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
