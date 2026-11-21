
from pathlib import Path
import pandas as pd
import pyarrow.parquet as pq

PROJECT_ROOT = Path(__file__).resolve().parents[3]
INPUT_PATH = PROJECT_ROOT / "data" / "processed" / "paysim_processed.parquet"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "fraud_training_data.parquet"

FEATURES = [
    "step",
    "type_code",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "orig_balance_diff",
    "dest_balance_diff",
    "orig_balance_zero",
    "large_transaction",
    "hour",
    "day"
]

def prepare_data():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Processed dataset not found: {INPUT_PATH}")

    parquet = pq.ParquetFile(INPUT_PATH)
    frames = []

    for batch in parquet.iter_batches(
        batch_size=250_000,
        columns=FEATURES + ["isFraud"]
    ):
        frames.append(batch.to_pandas())

    df = pd.concat(frames, ignore_index=True)

    X = df[FEATURES].astype("float32")
    y = df["isFraud"].astype("int8")

    result = X.copy()
    result["isFraud"] = y

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    result.to_parquet(OUTPUT_PATH, index=False)

    print("Feature preparation complete!")
    print(f"Total rows: {len(result):,}")
    print(f"Features: {len(FEATURES)}")
    print(f"Fraud records: {int(y.sum()):,}")
    print(f"Legitimate records: {int((y == 0).sum()):,}")
    print(f"Saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    prepare_data()
