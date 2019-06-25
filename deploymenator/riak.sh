#!/bin/bash

REPO="https://github.com/atticlab/docker-riak.git"

GIT_BRANCH='master'
BASE_DIR='/vhosts/'
CUR_DIR=${PWD}

dir=$(basename "$REPO" ".git")
dir=${BASE_DIR}${dir}

if [[ -d "$dir" ]]; then
   echo "Already cloned..."
else
   git clone -b $GIT_BRANCH "$REPO" $dir
fi