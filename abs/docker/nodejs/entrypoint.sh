#!/bin/bash

echo "Installing bower components"
bower --allow-root install

# Add ssh key
eval `ssh-agent`
chmod 600 /npm_key_rsa
ssh-add /npm_key_rsa

# Add github to known hosts
mkdir /root/.ssh
ssh-keyscan -H -p 7999 bitbucket.attic.pw > /root/.ssh/known_hosts

echo "Installing npm components"
npm install

echo "Creating symbolic link"
rm -rf /app/public/node_modules
cd /app/public/ && ln -s ../node_modules node_modules