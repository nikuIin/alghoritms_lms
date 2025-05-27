from python:3.13-slim

workdir /app

copy ./requirements.txt /app

run pip install -r requirements.txt

copy ./ /app/

expose 8000


entrypoint ["python", "app.py"]
