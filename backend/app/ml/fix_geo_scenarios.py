
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]

FILE = ROOT / "data" / "processed" / "early_warning_scenarios.parquet"

df = pd.read_parquet(FILE)

for account in df.loc[
    df["scenario"] == "geo_velocity", "nameOrig"
].unique():

    mask = df["nameOrig"] == account
    account_rows = df[mask]

    normal = account_rows[account_rows["scenario"] == "normal"]
    anomaly = account_rows[account_rows["scenario"] == "geo_velocity"]

    if normal.empty or anomaly.empty:
        continue

    baseline_step = normal.iloc[0]["step"]
    anomaly_index = anomaly.index[0]

    # Inject the suspicious transaction one hour later.
    df.loc[anomaly_index, "step"] = baseline_step + 1

df.to_parquet(FILE, index=False, compression="snappy")

print("Geo-velocity scenarios corrected!")

geo = df[df["scenario"] == "geo_velocity"]

print(
    geo.groupby("nameOrig")["step"]
    .agg(["min", "max"])
    .head(10)
)
