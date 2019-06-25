#!/bin/bash

REPOS=(
    "bitbucket.org/atticlab/cashier-daemon.git"
    "bitbucket.org/atticlab/emission-daemon.git"
)

GIT_USER='attic_lab'
GIT_PASS=''
GIT_BRANCH='0.1.0'
CUR_DIR=${PWD}

function makeconfig {
    cd $1 && cp -f ${CUR_DIR}/clear.env .env
}

while true
do
    stty_orig=`stty -g` # save original terminal setting.
    stty -echo          # turn-off echoing.
    read -ra key -p "App password: "
    stty $stty_orig     # restore terminal setting.

    if [[ ${key} == '' ]]; then
        echo "Error: App password is empty. Try again."
        continue
    fi

    GIT_PASS=${key}
    break
done

for i in "${REPOS[@]}"
do
    dir=$(basename "$i" ".git")
    dir=${CUR_DIR}/../${dir}

   if [[ -d "$dir" ]]; then
       cd $dir && makeconfig $dir && make build && cd ..
   else
       git clone -b $GIT_BRANCH "http://$GIT_USER:$GIT_PASS@$i" $dir
       cd $dir && makeconfig $dir && make build && cd ..
   fi
done