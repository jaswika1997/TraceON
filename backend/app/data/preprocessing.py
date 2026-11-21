
from pathlib import Path
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

PROJECT_ROOT = Path(__file__).resolve().parents[3]

RAW_PATH = PROJECT_ROOT / "data" / "raw" / "PS_20174392719_1491204439457_log.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
PROCESSED_PATH = PROCESSED_DIR / "paysim_processed.parquet"

CHUNK_SIZE = 250_000


def preprocess_chunk(df):
    # Remove rows missing essential fields
    df = df.dropna(subset=["step", "type", "amount"])

    # Remove invalid amounts
    df = df[df["amount"] > 0].copy()

    # Time features
    df["hour"] = df["step"] % 24
    df["day"] = df["step"] // 24

    # Encode transaction type
    type_mapping = {
        "CASH_IN": 0,
        "CASH_OUT": 1,
        "DEBIT": 2,
        "PAYMENT": 3,
        "TRANSFER": 4,
    }

    df["type_code"] = (
        df["type"].map(type_mapping).fillna(-1).astype("int8")
    )

    # Balance features
    df["orig_balance_diff"] = (
        df["oldbalanceOrg"] - df["newbalanceOrig"]
    )

    df["dest_balance_diff"] = (
        df["newbalanceDest"] - df["oldbalanceDest"]
    )

    # Behavioral flags
    df["orig_balance_zero"] = (
        df["newbalanceOrig"] == 0
    ).astype("int8")

    df["large_transaction"] = (
        df["amount"] > 200000
    ).astype("int8")

    return df


def process_dataset():
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_PATH}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    total_rows = 0
    fraud_rows = 0
    chunks_processed = 0
    writer = None

    if PROCESSED_PATH.exists():
        PROCESSED_PATH.unlink()

    try:
        for chunk in pd.read_csv(RAW_PATH, chunksize=CHUNK_SIZE):
            chunk = preprocess_chunk(chunk)

            table = pa.Table.from_pandas(
                chunk,
                preserve_index=False
            )

            if writer is None:
                writer = pq.ParquetWriter(
                    PROCESSED_PATH,
                    table.schema,
                    compression="snappy"
                )

            writer.write_table(table)

            total_rows += len(chunk)
            fraud_rows += int(chunk["isFraud"].sum())
            chunks_processed += 1

            print(
                f"Chunk {chunks_processed} complete | "
                f"Rows: {total_rows:,} | "
                f"Fraud: {fraud_rows:,}"
            )

    finally:
        if writer is not None:
            writer.close()

    return {
        "success": True,
        "processed_rows": total_rows,
        "fraud_rows": fraud_rows,
        "chunks": chunks_processed,
        "output_file": str(PROCESSED_PATH),
    }
