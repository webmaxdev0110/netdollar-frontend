#!/bin/bash

LOGIN=""
PASSWORD=""
while true
do
    read -ra LOGIN -p "Username: "
    LOGIN=${LOGIN,,}
    if [[ $LOGIN == '' ]]; then
        echo "Error: username cannot be empty!"
    else
        break
    fi
done

while true
do
    IFS= read -s  -p "Password: " PASSWORD
    if [[ $PASSWORD == '' ]]; then
        echo "Password cannot be empty!"
    else
        echo $'\n'
        break
    fi
done

while true
do
    IFS= read -s  -p "Repeat password: " pwd
    if [[ $PASSWORD == $pwd ]]; then
        echo $'\n'
        break
    else
        echo "Passwords do not match!"
    fi
done


while true
do
    PERMISSIONS=$(whiptail --nocancel --title "Grant permissions" --checklist \
    "Choose user's permissions" 20 105 12 \
    "riak_kv.get" "Retrieve objects" ON \
    "riak_kv.put" "Create or update objects" ON \
    "riak_kv.delete" "Delete objects" ON \
    "riak_kv.index" "Index objects using secondary indexes (2i)" ON \
    "riak_kv.list_keys" "List all of the keys in a bucket" OFF \
    "riak_kv.list_buckets" "List all buckets" OFF \
    "search.admin" "Allow to create and dele indexes, add and modify search schemas" OFF \
    "search.query" "Allow to query an index" OFF \
    "riak_core.get_bucket" "Retrieve the props associated with a bucket" ON \
    "riak_core.set_bucket" "Modify the props associated with a bucket" ON \
    "riak_core.get_bucket_type" "Retrieve the set of props associated with a bucket type" ON \
    "riak_core.set_bucket_type" "Modify the set of props associated with a bucket type" ON 3>&1 1>&2 2>&3)
    if [[ $PERMISSIONS != "" ]]; then
        PERMISSIONS=${PERMISSIONS//\"/}
        PERMISSIONS=${PERMISSIONS//\ /,}
        break
    fi
done

docker exec crypto-riak-node riak-admin security add-user $LOGIN password=$PASSWORD
docker exec crypto-riak-node riak-admin security grant $PERMISSIONS on any to $LOGIN