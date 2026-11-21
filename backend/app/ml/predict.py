
from pathlib import Path
import joblib
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "fraud_xgboost.joblib"

FEATURES = [
    "step", "type_code", "amount",
    "oldbalanceOrg", "newbalanceOrig",
    "oldbalanceDest", "newbalanceDest",
    "orig_balance_diff", "dest_balance_diff",
    "orig_balance_zero", "large_transaction",
    "hour", "day"
]

model = joblib.load(MODEL_PATH)

def predict_fraud(transaction: dict):
    missing = [feature for feature in FEATURES if feature not in transaction]
    if missing:
        raise ValueError(f"Missing features: {missing}")

    data = pd.DataFrame(
        [[transaction[feature] for feature in FEATURES]],
        columns=FEATURES
    ).astype("float32")

    probability = float(model.predict_proba(data)[0][1])
    risk_score = round(probability * 100, 2)

    if risk_score >= 80:
        risk_level = "Critical"
        recommendation = "Block"
    elif risk_score >= 60:
        risk_level = "High"
        recommendation = "Review"
    elif risk_score >= 30:
        risk_level = "Medium"
        recommendation = "Review"
    else:
        risk_level = "Low"
        recommendation = "Approve"

    return {
        "fraud_probability": round(probability, 4),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "recommendation": recommendation
    }
