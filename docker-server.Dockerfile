# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
FROM alpine:3.20.3 AS base
ENV NODE_VERSION 20.15.0

WORKDIR /usr/src/app

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/*

# Copy app source
COPY . .
 
RUN npm ci
RUN npm run build
RUN npm install ts-node -g

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE ${PORT}

CMD ["ts-node", "apps/server/src/server.js"]
