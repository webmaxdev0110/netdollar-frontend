#!/bin/bash

rm -f ./.env

regex='(https?:\/\/(www\.)?[-a-zA-Z0-9]{2,256}\.[a-z]{2,6})|((https?:\/\/)?([0-9]{1,3}\.){3}([0-9]{1,3}))(\:?[0-9]{1,5})?(\/)?'

while true
do
    read -ra peer -p "Riak host (should be available for other nodes): "
    peer=${peer,,}
    echo $peer
    if [[ ! $peer =~ $regex ]]; then
        echo "Error: address [$peer] is not valid!"
        continue
    else
        break
    fi
done

SLL_TARGET_DIR="./docker/nginx/ssl-cert/"

read -ra is_use_ssl -p "Do you want to use SSL (y/n)? "
if [[ $is_use_ssl = "y" ]]; then
    while true
    do
        read -ra ssl_certfile -p "Enter SSL certfile location path: "
        if [[ ! -f $ssl_certfile ]]; then
            echo "Warning: file $ssl_certfile is not exist, try again"
        else
            cp -rf "$ssl_certfile" "$SLL_TARGET_DIR"
            SSL_CERTFILE=$(basename $ssl_certfile)
            echo "SSL_CERTFILE=$SSL_CERTFILE" >> ./.env
            break
        fi
    done

    while true
    do
        read -ra ssl_keyfile -p "Enter SSL keyfile location path: "
        if [[ ! -f $ssl_keyfile ]]; then
            echo "Warning: file $ssl_keyfile is not exist, try again"
        else
            cp -rf "$ssl_keyfile" "$SLL_TARGET_DIR"
            SSL_KEYFILE=$(basename $ssl_keyfile)
            echo "SSL_KEYFILE=$SSL_KEYFILE" >> ./.env
            break
        fi
    done

    while true
    do
        read -ra ssl_clientcert -p "Enter SSL Client cert file location path: "
        if [[ ! -f $ssl_clientcert ]]; then
            echo "Warning: file $ssl_clientcert is not exist, try again"
        else
            cp -rf "$ssl_clientcert" "$SLL_TARGET_DIR"
            SSL_CLIENTCERT=$(basename $ssl_clientcert)
            echo "SSL_CLIENTCERT=$SSL_CLIENTCERT" >> ./.env
            break
        fi
    done
fi

peer=${peer#http://}
peer=${peer#https://}
echo "RIAK_HOST=$peer" >> ./.env
echo "DOMAIN=$peer" >> ./.env
echo "HOST=$peer" >> ./.env
