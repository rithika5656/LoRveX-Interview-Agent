from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ExperienceLevel = Literal["beginner", "intermediate", "advanced"]
InterviewType = Literal["technical", "behavioral", "hr", "mixed"]
Difficulty = Literal["easy", "medium", "hard", "adaptive"]
InterviewDuration = Literal[10, 20, 30]


class InterviewPlanStage(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    focus: str = Field(min_length=1, max_length=160)


class InterviewPlan(BaseModel):
    goal: str = Field(min_length=2, max_length=240)
    stages: list[InterviewPlanStage]
    difficulty: Difficulty | str = "adaptive"
    question_count: int = Field(alias="questionCount", default=4, ge=1, le=50)

    model_config = ConfigDict(populate_by_name=True)


class InterviewQuestion(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    text: str = Field(min_length=6, max_length=2400)
    type: InterviewType | str = "technical"
    difficulty: Difficulty | str = "medium"

    model_config = ConfigDict(populate_by_name=True)


class InterviewConfiguration(BaseModel):
    candidate_name: str = Field(alias="candidateName", min_length=2, max_length=80)
    target_role: str = Field(alias="targetRole", min_length=2, max_length=120)
    experience_level: ExperienceLevel = Field(alias="experienceLevel")
    interview_type: InterviewType = Field(alias="interviewType")
    difficulty: Difficulty
    duration: InterviewDuration

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    @field_validator("candidate_name", "target_role")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class InterviewCreateRequest(InterviewConfiguration):
    pass


class InterviewCreateResponse(BaseModel):
    session_id: str = Field(alias="sessionId")
    status: Literal["created"] = "created"
    configuration: InterviewConfiguration

    model_config = ConfigDict(populate_by_name=True)


class InterviewSessionRecord(InterviewCreateResponse):
    pass


class InterviewLookupResponse(InterviewCreateResponse):
    pass


class InterviewStartResponse(BaseModel):
    session_id: str = Field(alias="sessionId")
    status: Literal["started"] = "started"
    plan: InterviewPlan
    question: InterviewQuestion

    model_config = ConfigDict(populate_by_name=True)

