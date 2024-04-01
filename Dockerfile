FROM node:20

RUN apt-get update && apt-get install -y bash

USER node
WORKDIR /home/kinesis-deploy/typescript

COPY typescript/package*.json ./
RUN npm ci

COPY --chown=node:node pact ../pact
COPY --chown=node:node typescript ./
