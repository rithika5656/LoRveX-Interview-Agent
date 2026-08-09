from typing import List, Literal, Dict

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
    stage: str = Field(default="technical", min_length=1, max_length=80)
    curriculum_day: int | None = Field(alias="curriculumDay", default=None)
    module: str | None = Field(default=None, min_length=0, max_length=120)
    topic: str | None = Field(default=None, min_length=0, max_length=160)
    learning_objective: str | None = Field(alias="learningObjective", default=None, min_length=0, max_length=400)
    question_type: str | None = Field(alias="questionType", default=None, min_length=0, max_length=80)

    model_config = ConfigDict(populate_by_name=True)


AdaptiveDecisionAction = Literal["ask_question", "clarify_answer", "move_to_next_stage", "finish_interview"]


class InterviewAdaptiveDecision(BaseModel):
    action: AdaptiveDecisionAction = "ask_question"
    stage: str = Field(default="technical", min_length=1, max_length=80)
    difficulty: Difficulty | str = "medium"
    focus: str = Field(min_length=1, max_length=240)
    reason: str = Field(min_length=1, max_length=500)
    question_instruction: str = Field(default="", min_length=1, max_length=1000)

    model_config = ConfigDict(populate_by_name=True)


class InterviewAnswerNextState(BaseModel):
    action: AdaptiveDecisionAction = "ask_question"
    stage: str | None = Field(default=None, min_length=1, max_length=80)
    difficulty: Difficulty | str | None = None
    focus: str | None = Field(default=None, min_length=1, max_length=240)
    reason: str | None = Field(default=None, min_length=1, max_length=500)
    question: InterviewQuestion | None = None

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


class InterviewAnswer(BaseModel):
    question_id: str = Field(alias="questionId")
    text: str = Field(min_length=1, max_length=10000)
    submitted_at: str = Field(default_factory=lambda: "")

    model_config = ConfigDict(populate_by_name=True)


class InterviewEvaluation(BaseModel):
    question_id: str = Field(alias="questionId")
    score: int = Field(default=80, ge=0, le=100)
    assessment: str = Field(min_length=1, max_length=80)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    feedback: str = Field(min_length=4, max_length=4000)
    technical_accuracy: float = Field(default=0.8, ge=0.0, le=1.0)
    depth: int = Field(default=3, ge=0, le=10)
    reasoning: str = Field(default="", min_length=0, max_length=2000)
    clarity: float = Field(default=0.8, ge=0.0, le=1.0)
    gaps: list[str] = Field(default_factory=list)
    misconceptions: list[str] = Field(default_factory=list)
    followup_needed: bool = Field(default=False)
    model_config = ConfigDict(populate_by_name=True)


class InterviewAnswerSubmissionRequest(BaseModel):
    question_id: str = Field(alias="questionId", min_length=1, max_length=160)
    answer: str = Field(min_length=1, max_length=10000)

    model_config = ConfigDict(populate_by_name=True)


class InterviewAnswerSubmissionResponse(BaseModel):
    question_id: str = Field(alias="questionId")
    evaluation: InterviewEvaluation
    next: InterviewAnswerNextState

    model_config = ConfigDict(populate_by_name=True)


class InterviewSessionRuntime(BaseModel):
    session_id: str = Field(alias="sessionId")
    status: Literal["created", "started", "answered", "completed"] = "created"
    configuration: InterviewConfiguration
    interview_plan: InterviewPlan | None = Field(alias="interviewPlan", default=None)
    current_stage: str = Field(alias="currentStage", default="technical")
    current_difficulty: Difficulty | str = Field(alias="currentDifficulty", default="medium")
    current_question: InterviewQuestion | None = Field(alias="currentQuestion", default=None)
    question_history: list[InterviewQuestion] = Field(alias="questionHistory", default_factory=list)
    answer_history: list[InterviewAnswer] = Field(alias="answerHistory", default_factory=list)
    evaluations: list[InterviewEvaluation] = Field(default_factory=list)
    adaptive_decisions: list[InterviewAdaptiveDecision] = Field(alias="adaptiveDecisions", default_factory=list)
    candidate_profile: dict | None = Field(alias="candidateProfile", default=None)
    covered_days: list[int] = Field(alias="coveredDays", default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class FinalFeedback(BaseModel):
    interview_summary: str
    overall_score: int
    technical_strengths: List[str]
    knowledge_gaps: List[str]
    curriculum_coverage: Dict[str, int] | List[int]
    communication_assessment: str
    problem_solving_assessment: str
    engineering_depth: str
    recommendations: List[str]
    topics_to_revise: List[str]
    strengths: List[str]
    gaps: List[str]
    next: List[str]

    model_config = ConfigDict(populate_by_name=True)

