from fastapi import FastAPI
from views.user_view import router as user_router
from uvicorn import run

app = FastAPI()
app.include_router(user_router)

if __name__ == "__main__":
    run('app:app', reload=True)