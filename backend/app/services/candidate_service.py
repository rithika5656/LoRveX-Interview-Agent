from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..agents import candidate_profiler

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "candidates.json"


class CandidateService:
    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = Path(path) if path else DATA_PATH
        self._data: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                self._data = json.load(f)
        except Exception:
            self._data = {}

    def list_candidates(self) -> List[Dict[str, Any]]:
        return self._data.get("candidates", [])

    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        for c in self.list_candidates():
            member = c.get("member", {})
            if member.get("id") == candidate_id or member.get("name") == candidate_id:
                return c
        return None

    def build_learning_profile(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        candidate = self.get_candidate(candidate_id)
        if not candidate:
            return None
        # delegate to candidate_profiler for structured profile
        return candidate_profiler.build_profile(candidate)


candidate_service = CandidateService()
