FROM node:22-alpine

WORKDIR /app
COPY package*.json /app/
COPY frontend/package.json /app/frontend/package.json
RUN npm ci
COPY . /app

RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
