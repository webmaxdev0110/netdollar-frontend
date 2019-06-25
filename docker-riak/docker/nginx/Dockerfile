FROM nginx:1.11

COPY ./hosts /etc/nginx/conf.d
COPY entrypoint.sh /
COPY ./ssl-cert /etc/nginx/ssl

ENTRYPOINT ["/entrypoint.sh"]