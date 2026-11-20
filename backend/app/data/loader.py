
from pathlib import Path
import pandas as pd

# TraceON project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "PS_20174392719_1491204439457_log.csv"
)

def check_dataset():
    """Check whether the PaySim dataset exists."""
    return DATASET_PATH.exists()

def load_transactions(nrows=None):
    """
    Load PaySim transactions.

    nrows=None loads the complete dataset.
    Use nrows=1000 for quick testing.
    """
    if not check_dataset():
        raise FileNotFoundError(
            f"PaySim dataset not found at: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH, nrows=nrows)

    return df

def get_dataset_summary():
    """Return basic information about the dataset."""
    if not check_dataset():
        return {
            "loaded": False,
            "message": "PaySim dataset not found"
        }

    df = load_transactions(nrows=1000)

    return {
        "loaded": True,
        "file": DATASET_PATH.name,
        "sample_rows_loaded": len(df),
        "columns": list(df.columns),
        "sample_fraud_count": int(df["isFraud"].sum()),
        "sample_legitimate_count": int((df["isFraud"] == 0).sum())
    }