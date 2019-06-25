#!/bin/bash

REPOS=(
    "https://github.com/atticlab/cashier-daemon.git"
    "https://github.com/atticlab/emission-daemon.git"
)

GIT_BRANCH='master'
BASE_DIR='/vhosts/'
CUR_DIR=${PWD}

function makeconfig {
    cd $1 && cp -f ${CUR_DIR}/clear.env .env
}


for i in "${REPOS[@]}"
do
    dir=$(basename "$i" ".git")
    dir=${BASE_DIR}${dir}

   if [[ -d "$dir" ]]; then
       cd $dir && makeconfig $dir && make build && cd ..
   else
       git clone -b $GIT_BRANCH "$i" $dir
       cd $dir && makeconfig $dir && make build && cd ..
   fi
done