#!/usr/bin/env bash

#TODO: THIS HAS TO BE REVIEWED

# BUCKET_NAME="history"
# LOGS_DIR="logs"
# LOG_FILENAME="recurs-add.log"
# DIRECTORY="./history"

# HEADER="Content-Type: multipart/mixed"

# #create logs dir
# mkdir -p ${LOGS_DIR}

# #set bucket props
# (curl -v -XPUT ${RIAK_HOST}buckets/${BUCKET_NAME}/props -H "Content-Type: application/json" -d '{"props":{"allow_mult":'false'}}') >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
# printf "Script started at $(date '+%d/%m/%Y %H:%M:%S')\n\n\n" >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
# for f in $(find ${DIRECTORY} -name '*.*');
# do
#     DEST_PATH=$(echo ${f#$DIRECTORY} | sed 's/\//\%2f/g')
#     RIAK_COMMAND="buckets/${BUCKET_NAME}/keys/${DEST_PATH}?returnbody=false"
#     FULL_CMD="curl -v -XPUT  --data-binary @${f} -H \"${HEADER}\" ${RIAK_HOST}/${RIAK_COMMAND}"
#     #echo ${f};

#     #run the command
#     echo "Adding the file ${f}..."
#     printf ">>>>>>>>>>>>>>>>Adding the file ${f}<<<<<<<<<<<<<<<<<<<<<<\n\n" >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
#     (eval "${FULL_CMD}") >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
#     printf ">>>>>>>>>>>>>>>>DONE<<<<<<<<<<<<<<<<<<<<<<\n\n\n" >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
# done

# printf "Script done at $(date '+%d/%m/%Y %H:%M:%S')\n\n\n" >> ./${LOGS_DIR}/${LOG_FILENAME} 2>&1
# echo "Script done"