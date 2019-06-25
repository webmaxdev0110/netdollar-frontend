#!/bin/bash

sed -i "s#%DOMAIN%#$DOMAIN#g" /etc/nginx/conf.d/*
sed -i "s#%RIAK_NP_HOST%#$RIAK_NP_HOST#g" /etc/nginx/conf.d/*
sed -i "s#%HORIZON_NP_HOST%#$HORIZON_NP_HOST#g" /etc/nginx/conf.d/*
sed -i "s#%SERVICES_NP_HOST%#$SERVICES_NP_HOST#g" /etc/nginx/conf.d/*

nginx -g "daemon off;"