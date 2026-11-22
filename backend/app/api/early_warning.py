
import json
import math
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.ml.predict import predict_fraud


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ALERTS_FILE = (
    PROJECT_ROOT / "data" / "processed" / "early_warning_alerts.parquet"
)

LIVE_ALERTS_FILE = (
    PROJECT_ROOT / "data" / "processed" / "early_warning_live_alerts.jsonl"
)

GEO_SPEED_THRESHOLD = 100


# ---------------- REQUEST VALIDATION ----------------

class TransactionEvaluation(BaseModel):
    transaction_id: str
    account_id: str

    # XGBoost transaction inputs
    step: int = Field(ge=0)
    type_code: int = Field(ge=0, le=4)
    amount: float = Field(gt=0)
    oldbalanceOrg: float = Field(ge=0)
    newbalanceOrig: float = Field(ge=0)
    oldbalanceDest: float = Field(ge=0)
    newbalanceDest: float = Field(ge=0)

    # Current transaction context
    event_city: str
    event_lat: float = Field(ge=-90, le=90)
    event_lon: float = Field(ge=-180, le=180)
    event_ip: str
    event_device: str

    # Previously observed account context
    previous_step: int = Field(ge=0)
    previous_city: str
    previous_lat: float = Field(ge=-90, le=90)
    previous_lon: float = Field(ge=-180, le=180)
    previous_ip: str
    previous_device: str


# ---------------- FEATURE ENGINEERING ----------------

def build_model_features(transaction):
    return {
        "step": transaction.step,
        "type_code": transaction.type_code,
        "amount": transaction.amount,
        "oldbalanceOrg": transaction.oldbalanceOrg,
        "newbalanceOrig": transaction.newbalanceOrig,
        "oldbalanceDest": transaction.oldbalanceDest,
        "newbalanceDest": transaction.newbalanceDest,

        # Same calculations as preprocessing.py
        "orig_balance_diff": (
            transaction.oldbalanceOrg - transaction.newbalanceOrig
        ),
        "dest_balance_diff": (
            transaction.newbalanceDest - transaction.oldbalanceDest
        ),
        "orig_balance_zero": int(
            transaction.newbalanceOrig == 0
        ),
        "large_transaction": int(
            transaction.amount > 200000
        ),
        "hour": transaction.step % 24,
        "day": transaction.step // 24
    }


# ---------------- GEO DISTANCE ----------------

def haversine_distance(lat1, lon1, lat2, lon2):
    earth_radius = 6371

    lat1, lon1, lat2, lon2 = map(
        math.radians,
        [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 2 * earth_radius * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )


# ---------------- ALERT CREATION ----------------

def build_alert(
    transaction,
    alert_type,
    severity,
    risk_score,
    reason
):
    return {
        "alert_id": (
            f"ALT-{transaction.transaction_id}-{alert_type}"
        ),
        "transaction_id": transaction.transaction_id,
        "account_id": transaction.account_id,
        "alert_type": alert_type,
        "severity": severity,
        "risk_score": risk_score,
        "reason": reason,
        "step": transaction.step,
        "event_city": transaction.event_city,
        "metadata_simulated": True,
        "status": "OPEN"
    }


# ---------------- ALERT STORAGE ----------------

def save_live_alerts(alerts):
    if not alerts:
        return

    LIVE_ALERTS_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        LIVE_ALERTS_FILE,
        "a",
        encoding="utf-8"
    ) as file:

        for alert in alerts:
            file.write(json.dumps(alert) + "\n")


def load_all_alerts():
    frames = []

    if ALERTS_FILE.exists():
        frames.append(pd.read_parquet(ALERTS_FILE))

    if LIVE_ALERTS_FILE.exists():
        live_alerts = []

        with open(
            LIVE_ALERTS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            for line in file:
                if line.strip():
                    live_alerts.append(json.loads(line))

        if live_alerts:
            frames.append(pd.DataFrame(live_alerts))

    if not frames:
        return pd.DataFrame()

    return pd.concat(frames, ignore_index=True)


# ---------------- GET ALERTS ----------------

@router.get("/early-warning/alerts")
def get_early_warning_alerts(
    severity: str | None = None,
    alert_type: str | None = None,
    status: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    try:
        df = load_all_alerts()

        if df.empty:
            return {
                "total": 0,
                "limit": limit,
                "offset": offset,
                "alerts": []
            }

        if severity:
            df = df[
                df["severity"].str.upper() == severity.upper()
            ]

        if alert_type:
            df = df[
                df["alert_type"].str.upper() == alert_type.upper()
            ]

        if status:
            df = df[
                df["status"].str.upper() == status.upper()
            ]

        total = len(df)
        result = df.iloc[offset:offset + limit]

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "alerts": result.to_dict(orient="records")
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load alerts: {str(error)}"
        )


# ---------------- LIVE TRANSACTION EVALUATION ----------------

@router.post("/early-warning/evaluate")
def evaluate_new_transaction(
    transaction: TransactionEvaluation
):
    if transaction.step <= transaction.previous_step:
        raise HTTPException(
            status_code=400,
            detail="New transaction step must be later than previous step."
        )

    try:
        # 1. RUN XGBOOST MODEL
        model_features = build_model_features(transaction)
        model_result = predict_fraud(model_features)

        model_score = model_result["risk_score"]

        # 2. RUN EARLY WARNING RULES
        alerts = []

        time_gap = transaction.step - transaction.previous_step

        distance = haversine_distance(
            transaction.previous_lat,
            transaction.previous_lon,
            transaction.event_lat,
            transaction.event_lon
        )

        speed = distance / time_gap

        # GEO-VELOCITY
        if speed > GEO_SPEED_THRESHOLD:
            severity = "CRITICAL" if speed > 800 else "HIGH"

            alerts.append(
                build_alert(
                    transaction,
                    "GEO_VELOCITY",
                    severity,
                    min(99, int(70 + speed / 100)),
                    (
                        f"Location changed from {transaction.previous_city} "
                        f"to {transaction.event_city}. Distance: "
                        f"{distance:.2f} km in {time_gap} hour(s). "
                        f"Estimated speed: {speed:.2f} km/h."
                    )
                )
            )

        # NEW DEVICE
        if transaction.event_device != transaction.previous_device:
            alerts.append(
                build_alert(
                    transaction,
                    "NEW_DEVICE",
                    "MEDIUM",
                    65,
                    (
                        f"Device changed from "
                        f"{transaction.previous_device} to "
                        f"{transaction.event_device}."
                    )
                )
            )

        # IP CHANGE
        if transaction.event_ip != transaction.previous_ip:
            alerts.append(
                build_alert(
                    transaction,
                    "IP_CHANGE",
                    "MEDIUM",
                    60,
                    (
                        f"IP address changed from "
                        f"{transaction.previous_ip} to "
                        f"{transaction.event_ip}."
                    )
                )
            )

        # 3. CREATE MODEL ALERT IF RISK IS MEDIUM OR ABOVE
        if model_score >= 30:
            if model_score >= 80:
                model_severity = "CRITICAL"
            elif model_score >= 60:
                model_severity = "HIGH"
            else:
                model_severity = "MEDIUM"

            alerts.append(
                build_alert(
                    transaction,
                    "MODEL_FRAUD",
                    model_severity,
                    model_score,
                    (
                        f"XGBoost detected elevated fraud probability "
                        f"of {model_result['fraud_probability']:.4f}. "
                        f"Model recommendation: "
                        f"{model_result['recommendation']}."
                    )
                )
            )

        # 4. SAVE ALL GENERATED ALERTS
        save_live_alerts(alerts)

        # 5. COMBINE MODEL + RULE-BASED DECISIONS
        critical_geo = any(
            alert["alert_type"] == "GEO_VELOCITY"
            and alert["severity"] == "CRITICAL"
            for alert in alerts
        )

        if model_score >= 80 or critical_geo:
            decision = "FLAGGED"
        elif model_score >= 30 or alerts:
            decision = "REVIEW"
        else:
            decision = "APPROVED"

        combined_score = max(
            [model_score] + [
                alert["risk_score"] for alert in alerts
            ]
        )

        return {
            "transaction_id": transaction.transaction_id,
            "account_id": transaction.account_id,
            "decision": decision,
            "combined_risk_score": round(combined_score, 2),
            "model_prediction": model_result,
            "alerts_generated": len(alerts),
            "alerts": alerts,
            "message": (
                "Transaction flagged for investigation."
                if decision == "FLAGGED"
                else "Transaction requires analyst review."
                if decision == "REVIEW"
                else "No significant fraud or Early Warning signals detected."
            ),
            "metadata_simulated": True
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Transaction evaluation failed: {str(error)}"
        )
