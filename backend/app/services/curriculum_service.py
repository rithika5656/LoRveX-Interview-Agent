from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "curriculum.json"


class CurriculumService:
    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = Path(path) if path else DATA_PATH
        self._data: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                self._data = json.load(f)
        except Exception:
            # keep empty but raise for callers if needed
            self._data = {}

    def all_modules(self) -> List[Dict[str, Any]]:
        return self._data.get("modules", [])

    def all_days(self) -> List[Dict[str, Any]]:
        return self._data.get("days", [])

    def get_day(self, day_number: int) -> Optional[Dict[str, Any]]:
        for d in self.all_days():
            if d.get("day") == day_number:
                return d
        return None

    def get_module(self, n: int) -> Optional[Dict[str, Any]]:
        for m in self.all_modules():
            if m.get("n") == n:
                return m
        return None

    def days_for_module(self, module_n: int) -> List[int]:
        m = self.get_module(module_n)
        return m.get("days", []) if m else []


# simple module-level singleton for convenience
curriculum_service = CurriculumService()
