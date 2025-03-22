.PHONY: backend
backend:
	python3 ../src/app.py &

.PHONY: frontend
frontend:
	npm run dev &

.PHONY: run
run: backend frontend
	echo 'Server start'
