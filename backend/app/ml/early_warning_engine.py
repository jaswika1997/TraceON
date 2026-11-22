
import math
from pathlib import Path

import pandas as pd


# ---------------- CONFIGURATION ----------------

BASE_DIR = Path(__file__).resolve().parents[3]
INPUT_FILE = BASE_DIR / "data" / "processed" / "early_warning_scenarios.parquet"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "early_warning_alerts.parquet"

GEO_SPEED_THRESHOLD = 100  # km/h


# ---------------- GEO DISTANCE ----------------

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two coordinates in km."""

    earth_radius = 6371.0

    lat1, lon1, lat2, lon2 = map(
        math.radians, [lat1, lon1, lat2, lon2]
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
        math.sqrt(a), math.sqrt(1 - a)
    )


# ---------------- ALERT CREATION ----------------

def create_alert(transaction, alert_type, severity, risk_score, reason):

    return {
        "alert_id": f"ALT-{transaction['scenario_transaction_id']}-{alert_type.upper()}",
        "transaction_id": transaction["scenario_transaction_id"],
        "account_id": transaction["nameOrig"],
        "alert_type": alert_type,
        "severity": severity,
        "risk_score": risk_score,
        "reason": reason,
        "step": int(transaction["step"]),
        "event_city": transaction["event_city"],
        "metadata_simulated": True,
        "status": "OPEN",
    }


# ---------------- DETECTION ENGINE ----------------

def run_early_warning():

    print("Loading scenario transactions...")

    df = pd.read_parquet(INPUT_FILE)

    df = df.sort_values(["nameOrig", "step"]).reset_index(drop=True)

    alerts = []

    # Process each account independently
    for account_id, account_data in df.groupby("nameOrig"):

        account_data = account_data.sort_values("step")

        previous = None

        for _, current in account_data.iterrows():

            if previous is None:
                previous = current
                continue

            # Ignore normal baseline transactions
            if current["scenario"] == "normal":
                previous = current
                continue

            # 1. GEO-VELOCITY DETECTION
            if current["scenario"] == "geo_velocity":

                distance = haversine_distance(
                    previous["event_lat"],
                    previous["event_lon"],
                    current["event_lat"],
                    current["event_lon"],
                )

                time_gap = current["step"] - previous["step"]

                if time_gap > 0:
                    speed = distance / time_gap

                    if speed > GEO_SPEED_THRESHOLD:

                        severity = "CRITICAL" if speed > 800 else "HIGH"

                        alerts.append(
                            create_alert(
                                current,
                                "GEO_VELOCITY",
                                severity,
                                min(99, int(70 + speed / 100)),
                                (
                                    f"Account location changed from "
                                    f"{previous['event_city']} to "
                                    f"{current['event_city']}. "
                                    f"Travel distance: {distance:.2f} km "
                                    f"in {time_gap} hour(s), "
                                    f"estimated speed: {speed:.2f} km/h."
                                ),
                            )
                        )

            # 2. NEW DEVICE DETECTION
            if current["scenario"] == "new_device":

                if current["event_device"] != previous["event_device"]:

                    alerts.append(
                        create_alert(
                            current,
                            "NEW_DEVICE",
                            "MEDIUM",
                            65,
                            (
                                f"Previously observed device "
                                f"{previous['event_device']} changed to "
                                f"{current['event_device']}."
                            ),
                        )
                    )

            # 3. IP CHANGE DETECTION
            if current["scenario"] == "ip_change":

                if current["event_ip"] != previous["event_ip"]:

                    alerts.append(
                        create_alert(
                            current,
                            "IP_CHANGE",
                            "MEDIUM",
                            60,
                            (
                                f"Account IP address changed from "
                                f"{previous['event_ip']} to "
                                f"{current['event_ip']}."
                            ),
                        )
                    )

            previous = current

    # Save alerts
    alerts_df = pd.DataFrame(alerts)

    if not alerts_df.empty:
        alerts_df.to_parquet(OUTPUT_FILE, index=False)

    print("\nEarly Warning Detection Complete!")
    print(f"Transactions analysed: {len(df)}")
    print(f"Alerts generated: {len(alerts_df)}")

    if not alerts_df.empty:
        print("\nAlert counts:")
        print(alerts_df["alert_type"].value_counts())

        print("\nSeverity distribution:")
        print(alerts_df["severity"].value_counts())

        print("\nSample alerts:")
        print(
            alerts_df[
                [
                    "alert_id",
                    "transaction_id",
                    "alert_type",
                    "severity",
                    "risk_score",
                ]
            ].head(10).to_string(index=False)
        )

    return alerts_df


if __name__ == "__main__":
    run_early_warning()
