
from pathlib import Path
import json
import joblib
import pandas as pd
import xgboost as xgb

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    average_precision_score,
    roc_auc_score
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "fraud_training_data.parquet"
MODEL_DIR = PROJECT_ROOT / "backend" / "models"

FEATURES = [
    "step", "type_code", "amount",
    "oldbalanceOrg", "newbalanceOrig",
    "oldbalanceDest", "newbalanceDest",
    "orig_balance_diff", "dest_balance_diff",
    "orig_balance_zero", "large_transaction",
    "hour", "day"
]

def train_model():
    print("Loading prepared dataset...")
    df = pd.read_parquet(DATA_PATH)

    # Keep every fraud record and sample legitimate records.
    fraud = df[df["isFraud"] == 1]
    legitimate = df[df["isFraud"] == 0].sample(
        n=min(250_000, len(df[df["isFraud"] == 0])),
        random_state=42
    )

    data = pd.concat([fraud, legitimate], ignore_index=True)
    data = data.sample(frac=1, random_state=42).reset_index(drop=True)

    X = data[FEATURES]
    y = data["isFraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    scale_weight = (y_train == 0).sum() / (y_train == 1).sum()

    print(f"Training rows: {len(X_train):,}")
    print(f"Testing rows: {len(X_test):,}")
    print(f"Scale positive weight: {scale_weight:.2f}")
    print("Training XGBoost model...")

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=7,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_weight,
        objective="binary:logistic",
        eval_metric="aucpr",
        tree_method="hist",
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)

    print("\nMODEL EVALUATION")
    print(classification_report(y_test, predictions, zero_division=0))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))
    print(f"PR-AUC: {average_precision_score(y_test, probabilities):.4f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, probabilities):.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_DIR / "fraud_xgboost.joblib")

    metrics = {
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "fraud_training_rows": int(y_train.sum()),
        "fraud_testing_rows": int(y_test.sum()),
        "pr_auc": float(average_precision_score(y_test, probabilities)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "classification_report": classification_report(
            y_test, predictions, output_dict=True, zero_division=0
        ),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist()
    }

    with open(MODEL_DIR / "model_metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)

    print("\nModel saved successfully!")
    print(f"Model: {MODEL_DIR / 'fraud_xgboost.joblib'}")
    print(f"Metrics: {MODEL_DIR / 'model_metrics.json'}")

if __name__ == "__main__":
    train_model()
