#!/bin/bash

REPO="https://github.com/atticlab/docker-node.git"

GIT_USER=''
GIT_BRANCH='smar2.0'
BASE_DIR='/vhosts/'
CUR_DIR=${PWD}

dir=$(basename "$REPO" ".git")
dir=${BASE_DIR}${dir}

if [[ -d "$dir" ]]; then
   echo "Already cloned..."
else
   git clone -b $GIT_BRANCH "$REPO" $dir
fi