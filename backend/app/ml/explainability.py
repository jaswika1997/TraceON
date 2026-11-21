
from pathlib import Path
import joblib
import pandas as pd
import xgboost as xgb

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

def explain_prediction(transaction: dict):
    missing = [f for f in FEATURES if f not in transaction]
    if missing:
        raise ValueError(f"Missing features: {missing}")

    data = pd.DataFrame(
        [[transaction[f] for f in FEATURES]],
        columns=FEATURES
    ).astype("float32")

    dmatrix = xgb.DMatrix(data, feature_names=FEATURES)

    contributions = model.get_booster().predict(
        dmatrix,
        pred_contribs=True
    )[0]

    explanation = []

    for feature, contribution in zip(FEATURES, contributions[:-1]):
        explanation.append({
            "feature": feature,
            "value": float(transaction[feature]),
            "contribution": round(float(contribution), 4),
            "impact": "increases fraud risk" if contribution > 0
                      else "decreases fraud risk"
        })

    explanation.sort(
        key=lambda item: abs(item["contribution"]),
        reverse=True
    )

    return {
        "top_factors": explanation[:5],
        "base_value": round(float(contributions[-1]), 4),
        "explanation_method": "XGBoost Tree SHAP contributions"
    }
