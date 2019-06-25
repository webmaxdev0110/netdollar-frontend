#!/bin/bash

filename=".env"
if [ -s $filename ]; then \
    while IFS='' read -r line || [[ -n "$line" ]]; do
        set -- "$line"
        IFS="="; declare -a Array=($*)
        echo "    ${Array[0]}: '${Array[1]}', "
    done < "$filename"
fi