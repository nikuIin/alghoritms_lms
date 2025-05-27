from node:24-alpine

workdir /app

copy package.json package-lock.json vite.config.js .

run npm install

run mkdir /app/dist

copy dist /app/dist

expose 3000

entrypoint ["npm", "run", "preview"]
