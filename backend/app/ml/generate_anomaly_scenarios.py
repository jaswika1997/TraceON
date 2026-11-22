
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[3]

INPUT = ROOT / "data" / "processed" / "paysim_with_context.parquet"
OUTPUT = ROOT / "data" / "processed" / "early_warning_scenarios.parquet"

CITIES = {
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Pune": (18.5204, 73.8567),
    "Kolkata": (22.5726, 88.3639),
    "Jaipur": (26.9124, 75.7873),
    "Ahmedabad": (23.0225, 72.5714),
    "Kochi": (9.9312, 76.2673),
}

def main():
    if OUTPUT.exists():
        raise FileExistsError(
            f"{OUTPUT} already exists. Rename it before regenerating."
        )

    print("Loading transaction sample...")

    # Read a manageable sample for scenario generation.
    df = pd.read_parquet(
        INPUT,
        columns=[
            "step", "type", "amount", "nameOrig", "nameDest",
            "isFraud", "account_city", "account_lat",
            "account_lon", "ip_address", "device_id"
        ]
    )

    # Select accounts with multiple transactions.
    counts = df["nameOrig"].value_counts()
    eligible = counts[counts >= 2].index

    rng = np.random.default_rng(42)
    selected_accounts = rng.choice(
        eligible.to_numpy(),
        size=min(200, len(eligible)),
        replace=False
    )

    records = []

    for account in selected_accounts:
        history = (
            df[df["nameOrig"] == account]
            .sort_values("step")
            .drop_duplicates(subset=["step"])
        )

        if len(history) < 2:
            continue

        first = history.iloc[0].copy()
        second = history.iloc[1].copy()

        # Require distinct steps for a meaningful travel scenario.
        if second["step"] <= first["step"]:
            continue

        baseline_city = first["account_city"]
        baseline_ip = first["ip_address"]
        baseline_device = first["device_id"]

        # First transaction: normal baseline.
        normal = first.to_dict()
        normal.update({
            "event_city": baseline_city,
            "event_lat": first["account_lat"],
            "event_lon": first["account_lon"],
            "event_ip": baseline_ip,
            "event_device": baseline_device,
            "scenario": "normal",
            "expected_alert": False
        })
        records.append(normal)

        # Second transaction: inject one controlled anomaly.
        anomaly = second.to_dict()

        scenario_type = len(records) % 3

        if scenario_type == 0:
            # Geo-velocity: move to a faraway city.
            other_cities = [
                city for city in CITIES
                if city != baseline_city
            ]
            new_city = other_cities[
                int(rng.integers(0, len(other_cities)))
            ]
            lat, lon = CITIES[new_city]

            anomaly.update({
                "event_city": new_city,
                "event_lat": lat,
                "event_lon": lon,
                "event_ip": baseline_ip,
                "event_device": baseline_device,
                "scenario": "geo_velocity",
                "expected_alert": True
            })

        elif scenario_type == 1:
            anomaly.update({
                "event_city": baseline_city,
                "event_lat": first["account_lat"],
                "event_lon": first["account_lon"],
                "event_ip": baseline_ip,
                "event_device": f"NEW-{account[-6:]}",
                "scenario": "new_device",
                "expected_alert": True
            })

        else:
            anomaly.update({
                "event_city": baseline_city,
                "event_lat": first["account_lat"],
                "event_lon": first["account_lon"],
                "event_ip": f"172.16.{rng.integers(1, 255)}.{rng.integers(1, 255)}",
                "event_device": baseline_device,
                "scenario": "ip_change",
                "expected_alert": True
            })

        records.append(anomaly)

    result = pd.DataFrame(records)

    if result.empty:
        raise RuntimeError("No scenarios could be generated.")

    result.insert(
        0,
        "scenario_transaction_id",
        [f"SIM-TXN-{i:05d}" for i in range(1, len(result) + 1)]
    )

    result["metadata_simulated"] = True

    result.to_parquet(
        OUTPUT,
        index=False,
        compression="snappy"
    )

    print("\nScenario generation complete!")
    print("Transactions:", len(result))
    print("\nScenario counts:")
    print(result["scenario"].value_counts())
    print("\nSaved to:", OUTPUT)


if __name__ == "__main__":
    main()
