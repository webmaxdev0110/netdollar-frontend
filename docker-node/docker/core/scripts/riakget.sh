#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
    echo "Usage get.sh HOST BUCKET KEY FILE RIAK_USER(opt) RIAK_PASS(opt)"
    exit 1
fi

KEY=$(echo -n $3 | sha256sum | cut -c -64)
AUTH=''

if [[ "$5" != '' ]]; then
    AUTH="--insecure --user $5:$6"
fi

curl --fail --silent $AUTH --max-time 10 $1/buckets/$2/keys/$KEY -o $4
exit
