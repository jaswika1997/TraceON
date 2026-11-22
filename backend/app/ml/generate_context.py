
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


# Project paths
ROOT = Path(__file__).resolve().parents[3]

INPUT_FILE = ROOT / "data" / "processed" / "paysim_processed.parquet"
OUTPUT_FILE = ROOT / "data" / "processed" / "paysim_with_context.parquet"

BATCH_SIZE = 200_000

# Synthetic geographic reference data
CITIES = [
    ("Bengaluru", 12.9716, 77.5946),
    ("Mumbai", 19.0760, 72.8777),
    ("Delhi", 28.6139, 77.2090),
    ("Hyderabad", 17.3850, 78.4867),
    ("Chennai", 13.0827, 80.2707),
    ("Pune", 18.5204, 73.8567),
    ("Kolkata", 22.5726, 88.3639),
    ("Jaipur", 26.9124, 75.7873),
    ("Ahmedabad", 23.0225, 72.5714),
    ("Kochi", 9.9312, 76.2673),
]


def generate_metadata(account_ids):
    """
    Generate deterministic synthetic metadata.
    The same account always receives the same city,
    IP address and device ID.
    """

    hashes = pd.util.hash_pandas_object(
        account_ids.astype(str),
        index=False
    ).to_numpy(dtype=np.uint64)

    city_indices = hashes % len(CITIES)

    cities = np.array([city[0] for city in CITIES])
    latitudes = np.array([city[1] for city in CITIES])
    longitudes = np.array([city[2] for city in CITIES])

    # Deterministic simulated private IP addresses
    ip_addresses = (
        "10."
        + ((hashes >> 8) % 250).astype(str)
        + "."
        + ((hashes >> 16) % 250).astype(str)
        + "."
        + ((hashes >> 24) % 250).astype(str)
    )

    device_ids = np.array([
        f"DEV-{value % 500000:06d}"
        for value in hashes
    ])

    return pd.DataFrame({
        "account_city": cities[city_indices],
        "account_lat": latitudes[city_indices],
        "account_lon": longitudes[city_indices],
        "ip_address": ip_addresses,
        "device_id": device_ids,
        "metadata_simulated": True
    })


def main():

    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    if OUTPUT_FILE.exists():
        raise FileExistsError(
            f"{OUTPUT_FILE} already exists. "
            "Rename or remove it before regenerating."
        )

    parquet_file = pq.ParquetFile(INPUT_FILE)

    writer = None
    total_rows = 0

    print("Starting synthetic metadata generation...")
    print(f"Input: {INPUT_FILE}")
    print(f"Output: {OUTPUT_FILE}")

    try:
        for batch in parquet_file.iter_batches(
            batch_size=BATCH_SIZE
        ):
            df = batch.to_pandas()

            metadata = generate_metadata(df["nameOrig"])

            df["account_city"] = metadata["account_city"].values
            df["account_lat"] = metadata["account_lat"].values
            df["account_lon"] = metadata["account_lon"].values
            df["ip_address"] = metadata["ip_address"].values
            df["device_id"] = metadata["device_id"].values
            df["metadata_simulated"] = True

            table = pa.Table.from_pandas(
                df,
                preserve_index=False
            )

            if writer is None:
                writer = pq.ParquetWriter(
                    OUTPUT_FILE,
                    table.schema,
                    compression="snappy"
                )

            writer.write_table(table)

            total_rows += len(df)

            print(f"Processed {total_rows:,} transactions")

    finally:
        if writer is not None:
            writer.close()

    print("\nGeneration complete!")
    print(f"Total transactions: {total_rows:,}")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
