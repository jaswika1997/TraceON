
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data.loader import (
    check_dataset,
    load_transactions,
    get_dataset_summary
)

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
        return {
            "loaded": False,
            "message": "PaySim dataset not found"
        }

    limit = max(1, min(limit, 100))

    df = load_transactions(nrows=limit)

    return {
        "loaded": True,
        "rows_returned": len(df),
        "data": df.to_dict(orient="records")
    }
