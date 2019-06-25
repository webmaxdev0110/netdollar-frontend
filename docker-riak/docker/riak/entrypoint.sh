#!/bin/bash

# Check whether hostname changed and we need to delete ring contents
old_name=$(grep -P "nodename = " /etc/riak/riak.conf | cut -c 11-)
old_name=${old_name// }

if [[ $old_name != "riak@$RIAK_HOST" ]]; then
    echo "Node name switch: $old_name -> riak@$RIAK_HOST. Deleting ring files"
    rm -rf /var/lib/riak/ring/*
fi

sed -i '/^listener.http.internal =.*/d' /etc/riak/riak.conf
sed -i '/^listener.protobuf.internal =.*/d' /etc/riak/riak.conf

echo "listener.protobuf.internal = 0.0.0.0:8087" >> /etc/riak/riak.conf
echo "listener.http.internal = 0.0.0.0:8098" >> /etc/riak/riak.conf

if [[ ! -z "$SSL_CERTFILE" ]]; then
    echo "ssl.certfile = /etc/riak/cert.pem" >> /etc/riak/riak.conf
    echo "ssl.keyfile = /etc/riak/key.pem" >> /etc/riak/riak.conf
    echo "listener.https.internal = 0.0.0.0:8088" >> /etc/riak/riak.conf
    echo "Need HTTPS"
fi

echo "anti_entropy.concurrency_limit = 1" >> /etc/riak/riak.conf
echo "javascript.map_pool_size = 0" >> /etc/riak/riak.conf
echo "javascript.reduce_pool_size = 0" >> /etc/riak/riak.conf
echo "javascript.hook_pool_size = 0" >> /etc/riak/riak.conf
echo "erlang.distribution.port_range.minimum = 6000" >> /etc/riak/riak.conf
echo "erlang.distribution.port_range.maximum = 6005" >> /etc/riak/riak.conf

sed -i '/^search =.*/d' /etc/riak/riak.conf
echo "search = on" >> /etc/riak/riak.conf

sed -i '/^storage_backend =.*/d' /etc/riak/riak.conf
echo "storage_backend = leveldb" >> /etc/riak/riak.conf

sed -i '/^nodename =.*/d' /etc/riak/riak.conf
echo "nodename = riak@$RIAK_HOST" >> /etc/riak/riak.conf

# sed -i '/^riak_control =.*/d' /etc/riak/riak.conf
# echo "riak_control = on" >> /etc/riak/riak.conf

/usr/bin/supervisord
