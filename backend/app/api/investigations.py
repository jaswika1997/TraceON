
from pathlib import Path
import json

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.investigation.case_manager import (
    create_case,
    get_cases,
    get_case,
    update_case
)

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ALERTS_FILE = (
    PROJECT_ROOT / "data" / "processed" / "early_warning_alerts.parquet"
)

LIVE_ALERTS_FILE = (
    PROJECT_ROOT / "data" / "processed" / "early_warning_live_alerts.jsonl"
)


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    note: Optional[str] = None


def find_alert(alert_id: str):
    # Search generated scenario alerts
    if ALERTS_FILE.exists():
        df = pd.read_parquet(ALERTS_FILE)
        matches = df[df["alert_id"].astype(str) == alert_id]

        if not matches.empty:
            return matches.iloc[0].to_dict()

    # Search live alerts
    if LIVE_ALERTS_FILE.exists():
        with open(LIVE_ALERTS_FILE, "r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue

                alert = json.loads(line)

                if str(alert.get("alert_id")) == alert_id:
                    return alert

    return None


@router.get("/investigations")
def list_investigations():
    cases = get_cases()

    return {
        "count": len(cases),
        "cases": cases
    }


@router.post("/investigations/from-alert/{alert_id}")
def create_investigation_from_alert(alert_id: str):
    alert = find_alert(alert_id)

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    case = create_case(alert)

    return {
        "message": "Investigation case created or already exists",
        "case": case
    }


@router.get("/investigations/{case_id}")
def retrieve_investigation(case_id: str):
    case = get_case(case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found"
        )

    return case


@router.patch("/investigations/{case_id}")
def modify_investigation(case_id: str, payload: CaseUpdate):
    allowed_statuses = {
        "OPEN",
        "UNDER_REVIEW",
        "RESOLVED",
        "ESCALATED"
    }

    updates = payload.model_dump(exclude_unset=True)

    if "status" in updates:
        if updates["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid investigation status"
            )

    case = update_case(case_id, updates)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found"
        )

    return {
        "message": "Investigation updated successfully",
        "case": case
    }
