
from pathlib import Path
import json
import uuid
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CASES_FILE = PROJECT_ROOT / "data" / "processed" / "investigation_cases.json"


def _load_cases():
    if not CASES_FILE.exists():
        return []

    with open(CASES_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def _save_cases(cases):
    CASES_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(CASES_FILE, "w", encoding="utf-8") as file:
        json.dump(cases, file, indent=4)


def create_case(alert):
    cases = _load_cases()

    # Prevent duplicate cases for the same alert
    existing = next(
        (case for case in cases if case["alert_id"] == alert["alert_id"]),
        None
    )

    if existing:
        return existing

    now = datetime.now(timezone.utc).isoformat()

    case = {
        "case_id": f"CASE-{uuid.uuid4().hex[:8].upper()}",
        "alert_id": alert["alert_id"],
        "transaction_id": alert.get("transaction_id"),
        "account_id": alert.get("account_id"),
        "alert_type": alert.get("alert_type"),
        "severity": alert.get("severity"),
        "risk_score": alert.get("risk_score"),
        "reason": alert.get("reason"),
        "event_city": alert.get("event_city"),
        "status": "OPEN",
        "assigned_to": None,
        "notes": [],
        "created_at": now,
        "updated_at": now
    }

    cases.append(case)
    _save_cases(cases)

    return case


def get_cases():
    return _load_cases()


def get_case(case_id):
    cases = _load_cases()

    return next(
        (case for case in cases if case["case_id"] == case_id),
        None
    )


def update_case(case_id, updates):
    cases = _load_cases()

    for case in cases:
        if case["case_id"] == case_id:
            if "status" in updates:
                case["status"] = updates["status"]

            if "assigned_to" in updates:
                case["assigned_to"] = updates["assigned_to"]

            if "note" in updates and updates["note"]:
                case["notes"].append({
                    "note": updates["note"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

            case["updated_at"] = datetime.now(timezone.utc).isoformat()
            _save_cases(cases)

            return case

    return None
