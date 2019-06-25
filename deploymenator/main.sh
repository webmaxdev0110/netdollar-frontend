#!/bin/bash

REPOS=(
    "https://github.com/atticlab/api.git"
    "https://github.com/atticlab/cards-bot.git"
    "https://github.com/atticlab/merchant-bot.git"
    "https://github.com/atticlab/frontend.git"
)


GIT_BRANCH='smar2.0'
BASE_DIR='/vhosts/'
CUR_DIR=${PWD}

function makeconfig {
    cd $1 && cp -f ${CUR_DIR}/default.env .env
}

#clear old default config file
rm -rf ./default.env

cp -f ./clear.env default.env

echo "" >> ./default.env
read -p "Enter project name (use for labels):" project_name; echo "PROJECT_NAME=$project_name" >> ./default.env;
read -p "Enter SMTP host:" smtp_host; echo "SMTP_HOST=$smtp_host" >> ./default.env;
read -p "Enter SMTP port:" smtp_port; echo "SMTP_PORT=$smtp_port" >> ./default.env;
read -p "Enter SMTP security:" smtp_security; echo "SMTP_SECURITY=$smtp_security" >> ./default.env;
read -p "Enter SMTP username:" smtp_user; echo "SMTP_USER=$smtp_user" >> ./default.env;
read -p "Enter SMTP password:" smtp_pass; echo "SMTP_PASS=$smtp_pass" >> ./default.env;


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

echo "make indexes on api..."
cd ${BASE_DIR}api && sleep 1 && make indexes
echo "Complete"