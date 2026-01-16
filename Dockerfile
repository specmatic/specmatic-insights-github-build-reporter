# Use an official Node.js runtime as the base image
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g .

ENTRYPOINT [ "specmatic-insights-github-build-reporter" ]

CMD []
