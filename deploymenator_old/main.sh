#!/bin/bash

REPOS=(
    "bitbucket.org/atticlab/abs.git"
    "bitbucket.org/atticlab/api.git"
    "bitbucket.org/atticlab/cards-bot.git"
    "bitbucket.org/atticlab/merchant-bot.git"
    "bitbucket.org/atticlab/exchange.git"
    "bitbucket.org/atticlab/frontend.git"
)

GIT_USER='attic_lab'
GIT_PASS=''
GIT_BRANCH='0.1.0'
CUR_DIR=${PWD}

function makeconfig {
    cd $1 && cp -f ${CUR_DIR}/default.env .env
}

clear old default config file
rm -rf ./default.env

cp -f ./clear.env default.env

echo "" >> ./default.env
read -p "Enter project name (use for labels):" project_name; echo "PROJECT_NAME=$project_name" >> ./default.env;
read -p "Enter SMTP host:" smtp_host; echo "SMTP_HOST=$smtp_host" >> ./default.env;
read -p "Enter SMTP port:" smtp_port; echo "SMTP_PORT=$smtp_port" >> ./default.env;
read -p "Enter SMTP security:" smtp_security; echo "SMTP_SECURITY=$smtp_security" >> ./default.env;
read -p "Enter SMTP username:" smtp_user; echo "SMTP_USER=$smtp_user" >> ./default.env;
read -p "Enter SMTP password:" smtp_pass; echo "SMTP_PASS=$smtp_pass" >> ./default.env;

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
       git clone -b $GIT_BRANCH "https://$GIT_USER:$GIT_PASS@$i" $dir
       cd $dir && makeconfig $dir && make build && cd ..
   fi
done

echo "make indexes on api..."
cd ./api && sleep 1 && make indexes
echo "Complete"