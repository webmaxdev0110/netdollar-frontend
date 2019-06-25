#!/bin/bash

sed -i "s#%DOMAIN%#$DOMAIN#g" /etc/nginx/conf.d/*
sed -i "s#%HOST%#$HOST#g" /etc/nginx/conf.d/*

if [[ ! -z "$SSL_CERTFILE" ]]; then # || [[ -v "$SSL_KEYFILE" ]] || [[ -v "$SSL_CLIENTCERT" ]]; then
    echo "Enable SSL"
    sed -i "24i ssl on;" /etc/nginx/conf.d/riak.conf
    sed -i "25i ssl_certificate /etc/nginx/ssl/${SSL_CERTFILE};" /etc/nginx/conf.d/riak.conf
    sed -i "26i ssl_certificate_key /etc/nginx/ssl/${SSL_KEYFILE};" /etc/nginx/conf.d/riak.conf
    sed -i "27i ssl_session_timeout 5m;" /etc/nginx/conf.d/riak.conf
    sed -i "28i ssl_protocols SSLv2 SSLv3 TLSv1;" /etc/nginx/conf.d/riak.conf
    sed -i "29i ssl_prefer_server_ciphers on;" /etc/nginx/conf.d/riak.conf
    sed -i "30i ssl_verify_client on;" /etc/nginx/conf.d/riak.conf
    sed -i "31i ssl_client_certificate /etc/nginx/ssl/${SSL_CLIENTCERT};" /etc/nginx/conf.d/riak.conf
fi

nginx -g "daemon off;"