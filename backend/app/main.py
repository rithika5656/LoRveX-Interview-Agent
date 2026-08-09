from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api.routes.health import router as health_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes import interview as interview_router
from app.core.config import settings
from app.services.interview_service import InterviewService

app = FastAPI(title=settings.app_name, version="0.1.0")
app.state.interview_service = InterviewService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(interviews_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")
app.include_router(interview_router.router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "invalid_request",
                "message": "Invalid request data.",
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_server_error", "message": "Something went wrong."}},
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "environment": settings.environment,
        "status": "running",
    }
