FROM postgres:9.5

RUN mkdir -p /tmp/psql_data/

COPY db/dump.sql /tmp/psql_data/
COPY scripts/init.sh /docker-entrypoint-initdb.d/