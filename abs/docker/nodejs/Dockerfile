FROM node:argon

WORKDIR /app

RUN npm install -g bower

COPY ./entrypoint.sh /
COPY ./npm_key_rsa /

ENTRYPOINT ["/entrypoint.sh"]