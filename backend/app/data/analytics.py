
from pathlib import Path
import json
import pyarrow.parquet as pq

PROJECT_ROOT = Path(__file__).resolve().parents[3]

PARQUET_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "paysim_processed.parquet"
)

SUMMARY_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "analytics_summary.json"
)


def generate_analytics():
    if not PARQUET_PATH.exists():
        raise FileNotFoundError("Processed PaySim file not found.")

    parquet_file = pq.ParquetFile(PARQUET_PATH)

    total_transactions = 0
    fraud_transactions = 0
    legitimate_transactions = 0
    total_amount = 0.0
    max_amount = 0.0
    transaction_types = {}

    columns = ["amount", "isFraud", "type"]

    for batch in parquet_file.iter_batches(
        batch_size=250_000,
        columns=columns
    ):
        df = batch.to_pandas()

        total_transactions += len(df)

        fraud_transactions += int(df["isFraud"].sum())
        legitimate_transactions += int(
            (df["isFraud"] == 0).sum()
        )

        total_amount += float(df["amount"].sum())

        if not df.empty:
            max_amount = max(
                max_amount,
                float(df["amount"].max())
            )

        counts = df["type"].value_counts()

        for transaction_type, count in counts.items():
            transaction_types[transaction_type] = (
                transaction_types.get(transaction_type, 0)
                + int(count)
            )

    fraud_rate = (
        fraud_transactions / total_transactions * 100
        if total_transactions else 0
    )

    summary = {
        "total_transactions": total_transactions,
        "fraud_transactions": fraud_transactions,
        "legitimate_transactions": legitimate_transactions,
        "fraud_rate": round(fraud_rate, 4),
        "total_transaction_amount": round(total_amount, 2),
        "average_transaction_amount": round(
            total_amount / total_transactions, 2
        ) if total_transactions else 0,
        "largest_transaction_amount": round(max_amount, 2),
        "transaction_types": transaction_types,
        "source": "PaySim processed dataset"
    }

    SUMMARY_PATH.write_text(
        json.dumps(summary, indent=4),
        encoding="utf-8"
    )

    return summary


if __name__ == "__main__":
    print(generate_analytics())
