FROM node:7.2

COPY ./package.json /tmp
COPY ./Gulpfile.js /tmp
COPY ./logo.svg /tmp
COPY ./logo-white.svg /tmp

RUN cd /tmp && npm install

WORKDIR /src

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
