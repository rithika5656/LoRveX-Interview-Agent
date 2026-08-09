from __future__ import annotations
from typing import Dict, Any, List


def _collect_topics(candidate: Dict[str, Any]) -> Dict[str, List[int]]:
    missions = candidate.get("missions", [])
    completed = []
    skipped = []
    failed = []
    for m in missions:
        day = m.get("day")
        if m.get("skipped"):
            skipped.append(day)
        elif m.get("passed"):
            completed.append(day)
        else:
            failed.append(day)
    return {"completed": completed, "skipped": skipped, "failed": failed}


def build_profile(candidate: Dict[str, Any]) -> Dict[str, Any]:
    member = candidate.get("member", {})
    signals = candidate.get("signals", {})

    topics = _collect_topics(candidate)

    # infer strong topics: many first-try passes
    strong = []
    challenging = []

    for m in candidate.get("missions", []):
        day = m.get("day")
        attempts = m.get("attempts") or 0
        passed = m.get("passed", False)
        if passed and attempts <= 1:
            strong.append(day)
        elif passed and attempts > 1:
            # passed but multiple attempts -> somewhat challenging
            challenging.append(day)
        elif not passed and not m.get("skipped"):
            challenging.append(day)

    # recommended topics: days not completed yet or failed
    completed_set = set(topics.get("completed", []))
    all_days = [m.get("day") for m in candidate.get("missions", []) if m.get("day")]
    recommended = [d for d in all_days if d not in completed_set]

    profile = {
        "candidate_id": member.get("id"),
        "name": member.get("name"),
        "role": member.get("jobRole"),
        "experience_years": member.get("yearsExperience"),
        "education": member.get("education"),
        "signals": signals,
        "strong_topics": sorted(list(set(strong))),
        "challenging_topics": sorted(list(set(challenging))),
        "skipped_topics": sorted(list(set(topics.get("skipped", [])))),
        "completed_topics": sorted(list(set(topics.get("completed", [])))),
        "recommended_topics": sorted(list(set(recommended)))
    }

    return profile
