#!/bin/bash

sed -i "s#%DOMAIN%#$DOMAIN#g" /etc/nginx/conf.d/*

nginx -g "daemon off;"