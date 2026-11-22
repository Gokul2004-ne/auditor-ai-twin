import json
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("audit_twin.workflow_state")

STATE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "audit_workflow_state.json")
STATE_FILE = os.path.abspath(STATE_FILE)


class WorkflowStateService:
    def __init__(self):
        self._state: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    self._state = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load workflow state file: {e}")
            self._state = {}

    def _save(self):
        try:
            os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
            with open(STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._state, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"Could not save workflow state file: {e}")

    def get_state(self, audit_id: str) -> Dict[str, Any]:
        return self._state.get(audit_id, {
            "workflow_status": "under_review",
            "resend_count": 0,
            "rebind_count": 0,
            "last_rejected_clause": None,
            "last_rejected_clause_index": None,
            "resend_statement": "",
            "corrective_recommendation": "",
            "rca_8delta": None,
            "history": []
        })

    def update_state(self, audit_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        curr = self.get_state(audit_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Handle specific workflow events
        new_status = updates.get("workflow_status") or updates.get("status")
        
        if new_status in ("resended", "rejected"):
            curr["resend_count"] = (curr.get("resend_count") or 0) + 1
            curr["workflow_status"] = "resended"
            if updates.get("resend_statement"):
                curr["resend_statement"] = updates["resend_statement"]
            if updates.get("last_rejected_clause"):
                curr["last_rejected_clause"] = updates["last_rejected_clause"]
            if updates.get("last_rejected_clause_index") is not None:
                curr["last_rejected_clause_index"] = updates["last_rejected_clause_index"]
            elif curr.get("last_rejected_clause"):
                c = str(curr["last_rejected_clause"])
                if "4.1" in c: curr["last_rejected_clause_index"] = 0
                elif "4.2" in c: curr["last_rejected_clause_index"] = 1
                elif "5.1" in c: curr["last_rejected_clause_index"] = 2
                elif "6.2" in c: curr["last_rejected_clause_index"] = 3
                elif "6.4" in c: curr["last_rejected_clause_index"] = 4
            if updates.get("corrective_recommendation"):
                curr["corrective_recommendation"] = updates["corrective_recommendation"]

            curr.setdefault("history", []).append({
                "action": "resended",
                "count": curr["resend_count"],
                "clause": curr.get("last_rejected_clause"),
                "statement": curr.get("resend_statement"),
                "timestamp": now_iso
            })

        elif new_status in ("rebinded", "resubmitted"):
            curr["rebind_count"] = (curr.get("rebind_count") or 0) + 1
            curr["workflow_status"] = "rebinded"
            if updates.get("rca_8delta"):
                curr["rca_8delta"] = updates["rca_8delta"]
            if updates.get("last_rejected_clause_index") is not None:
                curr["last_rejected_clause_index"] = updates["last_rejected_clause_index"]
            elif curr.get("last_rejected_clause") and curr.get("last_rejected_clause_index") is None:
                c = str(curr["last_rejected_clause"])
                if "4.1" in c: curr["last_rejected_clause_index"] = 0
                elif "4.2" in c: curr["last_rejected_clause_index"] = 1
                elif "5.1" in c: curr["last_rejected_clause_index"] = 2
                elif "6.2" in c: curr["last_rejected_clause_index"] = 3
                elif "6.4" in c: curr["last_rejected_clause_index"] = 4

            curr.setdefault("history", []).append({
                "action": "rebinded",
                "count": curr["rebind_count"],
                "timestamp": now_iso
            })

        elif new_status in ("approved", "signed"):
            curr["workflow_status"] = "approved"
            curr.setdefault("history", []).append({
                "action": "approved",
                "timestamp": now_iso
            })
        elif new_status:
            curr["workflow_status"] = new_status

        for k, v in updates.items():
            if k not in ("status", "workflow_status") and v is not None:
                curr[k] = v

        curr["updated_at"] = now_iso
        self._state[audit_id] = curr
        self._save()
        return curr

    def enrich_audit(self, audit: Dict[str, Any]) -> Dict[str, Any]:
        if not audit or not audit.get("id"):
            return audit
        audit_id = audit["id"]
        state = self.get_state(audit_id)
        
        # Override with rich workflow state
        if state.get("workflow_status"):
            audit["status"] = state["workflow_status"]
            audit["workflow_status"] = state["workflow_status"]
        
        audit["resend_count"] = state.get("resend_count", 0)
        audit["rebind_count"] = state.get("rebind_count", 0)
        audit["last_rejected_clause"] = state.get("last_rejected_clause")
        audit["last_rejected_clause_index"] = state.get("last_rejected_clause_index")
        if state.get("overall_score") is not None and (audit.get("overall_score") is None or audit.get("overall_score") == 0):
            audit["overall_score"] = state["overall_score"]
        audit["resend_statement"] = state.get("resend_statement", "")
        audit["corrective_recommendation"] = state.get("corrective_recommendation", "")
        audit["rca_8delta"] = state.get("rca_8delta")
        audit["workflow_history"] = state.get("history", [])
        return audit


workflow_state_service = WorkflowStateService()
