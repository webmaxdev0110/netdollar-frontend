#!/bin/bash

HOST_REGEX='(https?:\/\/(www\.)?[-a-zA-Z0-9]{2,256}\.[a-z]{2,6})|((https?:\/\/)?([0-9]{1,3}\.){3}([0-9]{1,3}))(\:?[0-9]{1,5})?(\/)?'
GENSEED="$(docker run --rm crypto/core src/stellar-core --genseed)"
SEED=${GENSEED:13:56}
PUBLIC=${GENSEED:78:56}
IS_VALIDATOR='false'
MASTER_KEY=''
COMISSION_KEY=''
GENERAL_KEY=''
PEERS=''
RIAK_HOST=''
RIAK_USER=''
RIAK_PASS=''

# Parse args
for i in "$@"
do
case $i in
    # -s=*|--searchpath=*)
    --is-validator)
    IS_VALIDATOR="true"
    shift
    ;;
    *)
        echo "Unknown option: $i"
        exit
    ;;
esac
done

strpos()
{
    local str=${1}
    local offset=${3}

    if [ -n "${offset}" ]; then
        str=`substr "${str}" ${offset}`
    else
        offset=0
    fi

    str=${str/${2}*/}

    if [ "${#str}" -eq "${#1}" ]; then
        return 0
    fi

    echo $((${#str}+${offset}))
}

while true
do
    read -ra key -p "Node seed [leave empty to generate]: "
    if [[ $key == '' ]]; then
        break
    fi

    valid="$(docker run --rm crypto/core src/stellar-core --checkseed $key)"
    if [[ $valid == 0 ]]; then
        echo "Error: seed is invalid. Try again."
    else
        SEED=$key
        PUBLIC=$valid
        break
    fi
done

while true
do
    read -ra key -p "Bank master key: "
    valid="$(docker run --rm crypto/core src/stellar-core --checkpub $key)"
    if [[ $valid == 1 ]]; then
        MASTER_KEY=$key
        break
    else
        echo "Error: key is invalid. Try again."
    fi
done

while true
do
    read -ra key -p "Comission key: "
    valid="$(docker run --rm crypto/core src/stellar-core --checkpub $key)"
    if [[ $key == $MASTER_KEY ]]; then
        echo "Error: comission key must be different from master key."
    elif [[ $valid == 1 ]]; then
        COMISSION_KEY=$key
        break
    else
        echo "Error: key is invalid. Try again."
    fi
done

while true
do
    read -ra peer -p "Add preferred peer (empty line to finish): "
    if [[ $peer == '' ]]; then
        break
    fi

    peer=${peer,,}
    if [[ ! $peer =~ $HOST_REGEX ]]; then
        echo "Error: Peer address [$peer] is not valid!"
        continue
    fi


    peer=${peer#http://}
    peer=${peer#https://}
    peer=${peer%/}
    peer=${peer// }
    exists="$(strpos \"$PEERS\" \"$peer\")"
    if [[ $exists != '' ]]; then
        echo "Error: Peer address [$peer] already added!"
        continue
    fi

    echo "$peer added to preferred!"

    PEERS+=\"$peer:11625\",
done

while true
do
    read -ra peer -p "Riak Host: (with protocol and port)"
    peer=${peer,,}

    if [[ ! $peer =~ $HOST_REGEX ]]
    then
        echo "Error: riak host [$peer] is not valid!"
        continue
    fi
    peer=${peer%%+(/)}

    RIAK_HOST=${peer// }
    break
done

while true
do
    read -ra key -p "Riak username [leave empty to skip]: "
    if [[ $key == '' ]]; then
        break
    fi

    RIAK_USER=$key
    while true
    do
        IFS= read -s  -p "Riak password: " key
        if [[ $key != '' ]]; then
            RIAK_PASS=$key
            break 2
        fi

        echo "Password cannot be empty"
    done
done

rm -f ./.core-cfg
echo $'\n'
echo "**************************************************************************"
echo "Node public key [$PUBLIC]"
echo "**************************************************************************"

echo "RIAK_HOST=$RIAK_HOST" >> ./.core-cfg
if [[ $RIAK_USER != '' ]]; then
    echo "RIAK_USER=$RIAK_USER" >> ./.core-cfg
fi
if [[ $RIAK_PASS != '' ]]; then
    echo "RIAK_PASS=$RIAK_PASS" >> ./.core-cfg
fi
echo "NODE_SEED=$SEED" >> ./.core-cfg
echo "NODE_IS_VALIDATOR=$IS_VALIDATOR" >> ./.core-cfg
echo "BANK_MASTER_KEY=$MASTER_KEY" >> ./.core-cfg
echo "BANK_COMMISSION_KEY=$COMISSION_KEY" >> ./.core-cfg

if [[ $PEERS != '' ]]; then
    echo "PREFERRED_PEERS=[${PEERS::-1}]" >> ./.core-cfg
fi
