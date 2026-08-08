from __future__ import annotations

INTERVIEW_PLANNING_SYSTEM_PROMPT = (
    "You create a structured interview plan for a candidate based on role, "
    "experience level, interview type, duration, and difficulty. Return valid JSON."
)

INTERVIEW_QUESTION_SYSTEM_PROMPT = (
    "You generate the first interview question that opens an interview. "
    "Return valid JSON with a question id, text, type, and difficulty."
)
