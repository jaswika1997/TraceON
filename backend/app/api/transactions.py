
import pandas as pd
import pyarrow.parquet as pq

from fastapi import APIRouter, HTTPException, Query
from app.ml.predict import model, FEATURES
from app.ml.explainability import explain_prediction

router = APIRouter()

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "paysim_processed.parquet"

TRANSACTION_TYPES = {
    0: "CASH_IN",
    1: "CASH_OUT",
    2: "DEBIT",
    3: "PAYMENT",
    4: "TRANSFER"
}


@router.get("/transactions")
def get_transactions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    risk: str = Query("all")
):
    if not DATA_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Processed dataset not found"
        )

    allowed_risks = {"all", "low", "medium", "high", "critical"}

    risk = risk.strip().lower()

    if risk not in allowed_risks:
        raise HTTPException(
            status_code=400,
            detail="Invalid risk filter"
        )

    parquet_file = pq.ParquetFile(DATA_PATH)

    transactions = []
    current_row = 0

    for batch in parquet_file.iter_batches(batch_size=10000):
        batch_df = batch.to_pandas()

        batch_start = current_row
        batch_end = current_row + len(batch_df)
        current_row = batch_end

        # Skip rows before the requested offset
        if batch_end <= offset:
            continue

        start_in_batch = max(0, offset - batch_start)
        batch_df = batch_df.iloc[start_in_batch:].copy()

        if batch_df.empty:
            continue

        row_indices = range(
            batch_start + start_in_batch,
            batch_start + start_in_batch + len(batch_df)
        )

        # Generate predictions for the entire batch
        feature_data = batch_df[FEATURES].astype("float32")
        probabilities = model.predict_proba(feature_data)[:, 1]

        for row_index, (_, row), probability in zip(
            row_indices,
            batch_df.iterrows(),
            probabilities
        ):
            probability = float(probability)
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

            if risk != "all" and risk_level.lower() != risk:
                continue

            transactions.append({
                "transaction_id": int(row_index),
                "transaction_type": TRANSACTION_TYPES.get(
                    int(row["type_code"]), "UNKNOWN"
                ),
                "amount": float(row["amount"]),
                "step": int(row["step"]),
                "actual_label": int(row["isFraud"]),
                "fraud_probability": round(probability, 4),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "recommendation": recommendation
            })

            if len(transactions) >= limit:
                break

        if len(transactions) >= limit:
            break

    return {
        "count": len(transactions),
        "transactions": transactions
    }
@router.get("/transactions/{transaction_id}/explanation")
def get_transaction_explanation(transaction_id: int):
    if transaction_id < 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction ID"
        )

    if not DATA_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Processed dataset not found"
        )

    parquet_file = pq.ParquetFile(DATA_PATH)
    current_row = 0

    for batch in parquet_file.iter_batches(batch_size=10000):
        batch_df = batch.to_pandas()

        batch_end = current_row + len(batch_df)

        if current_row <= transaction_id < batch_end:
            row = batch_df.iloc[transaction_id - current_row]

            transaction = {}

            for feature in FEATURES:
                value = row[feature]

                if hasattr(value, "item"):
                    value = value.item()

                transaction[feature] = value

            explanation = explain_prediction(transaction)

            return {
                "transaction_id": transaction_id,
                "explanation": explanation
            }

        current_row = batch_end

    raise HTTPException(
        status_code=404,
        detail="Transaction not found"
    )