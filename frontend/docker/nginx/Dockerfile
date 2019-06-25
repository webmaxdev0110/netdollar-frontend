FROM nginx:1.11

COPY ./hosts /etc/nginx/conf.d
COPY entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]