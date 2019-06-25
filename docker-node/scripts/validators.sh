#!/bin/bash

OPERATION=''
KEY=''

# Parse args
for i in "$@"
do
case $i in
    --add=*)
        KEY="${i#*=}"
        OPERATION='add'
    shift
    ;;
    --remove=*)
        KEY="${i#*=}"
        OPERATION='remove'
    shift
    ;;
esac
done

if [[ $OPERATION == '' ]]; then
    echo "Error: run script with --add=PUB_KEY or --remove=PUB_KEY param";
    exit;
fi

if [ ! -f ./.core-cfg ]; then
    echo "Error: config file does not exists! Run make <agent|gate|validator> first"
    exit;
fi

valid="$(docker run --rm crypto/core src/stellar-core --checkpub $KEY)"
if [[ $valid != 1 ]]; then
    echo "Error: key is invalid. Try again."
    exit;
fi

OUTPUT=''
EXISTS=false
VALIDATORS=$(grep -P "^VALIDATORS" ./.core-cfg | tail -1 | cut -c 13-)

if [[ $VALIDATORS != '' ]]; then
    VALIDATORS=${VALIDATORS::-1}
fi

IFS=',' read -ra v <<< "$VALIDATORS"
for i in "${v[@]}"; do
    # trim
    i=${i// }
    # remove quotes
    i=${i:1:-1}

    if [[ $i == $KEY ]]; then
        EXISTS=true
    fi

    if [[ $OPERATION != 'remove' || $i != $KEY ]]; then
        OUTPUT+=\"${i}\",
    fi
done


if [[ $EXISTS != true && $OPERATION == 'add' ]]; then
    OUTPUT+=\"${KEY}\",
fi

if [[ $OUTPUT != '' ]]; then
    OUTPUT=${OUTPUT::-1}
fi

echo "OK"

# Remove prev validators lines
sed -i '/^VALIDATORS=.*/d' ./.core-cfg

if [[ $OUTPUT != '' ]]; then
    echo "VALIDATORS=[$OUTPUT]" >> ./.core-cfg
fi