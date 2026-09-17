FROM node:22-alpine

WORKDIR /app
COPY frontend/package*.json /app/
RUN npm ci
COPY frontend /app

RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
