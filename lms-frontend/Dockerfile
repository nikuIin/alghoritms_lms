from node:24-alpine

workdir /lms-frontend

copy package.json package-lock.json .

run npm install

copy dist .

expose 4173

entrypoint ["npm", "run", "preview"]
