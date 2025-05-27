from fastapi import Depends, FastAPI
from uvicorn import run


app = FastAPI()


def validator_user(user: str):
    if len(user) == 1:
        raise ValueError()


def get_user(name: str, id: int):
    return {"name": name, "id": id}


@app.get("/user/", dependencies=[Depends(validator_user)])
def validate_user() -> bool:
    return True


@app.get("/user_data/")
def get_user_data(user=Depends(get_user)):
    return user


if __name__ == "__main__":
    run("some:app", reload=True)
