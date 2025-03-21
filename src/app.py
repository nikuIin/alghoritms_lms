from fastapi import FastAPI
from views.user_view import router as user_router
from views.course_view import router as course_router
from views.assignment_view import router as assignment_router
from views.solution_view import router as solution_router
from views.grade_journal_view import router as grade_journal_router
from uvicorn import run

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(user_router)
app.include_router(course_router)
app.include_router(assignment_router)
app.include_router(solution_router)
app.include_router(grade_journal_router)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    run("app:app", reload=True)
