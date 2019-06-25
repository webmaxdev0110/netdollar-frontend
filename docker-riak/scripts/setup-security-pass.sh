#!/bin/bash

docker exec crypto-riak-node riak-admin security add-source all 0.0.0.0/0 password
docker exec crypto-riak-node riak-admin security enable