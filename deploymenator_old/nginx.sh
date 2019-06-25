#!/bin/bash

REPO="bitbucket.org/atticlab/nginx-proxy.git"

GIT_USER='attic_lab'
GIT_PASS=''
GIT_BRANCH='0.1.0'

dir=$(basename "$REPO" ".git")
dir=${PWD}/../${dir}

if [[ -d "$dir" ]]; then
   echo "Folder $dir already exists"
else
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

   git clone -b $GIT_BRANCH "https://$GIT_USER:$GIT_PASS@$REPO" $dir
fi