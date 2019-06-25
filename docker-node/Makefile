ARGS = $(filter-out $@,$(MAKECMDGOALS))
CONTAINERS = $(shell docker ps -a -q)
VOLUMES = $(shell docker volume ls |awk 'NR>1 {print $2}')

stop:
	docker-compose stop

attach:
	docker exec -i -t ${c} /bin/bash

purge:
	docker stop $(CONTAINERS)
	docker rm $(CONTAINERS)
	docker volume rm $(VOLUMES)

build:
	@touch .core-cfg
	docker-compose build

start: build
	@if [ ! -s ./.core-cfg ]; then \
	 	echo "Error: node is not configured! Run make <agent|gate|validator> first"; \
	else \
		docker-compose up -d; \
    fi

keypair: build
	docker run --rm crypto/core src/stellar-core --genseed

gate: build
	./scripts/setup.sh

agent: build
	./scripts/setup.sh

validator: build
	./scripts/setup.sh --is-validator

validator-add: stop
	@if [ "${key}" = "" ]; then \
	 	echo "Please use validator-add key='YOUR_KEY'"; \
    elif [ ! -s ./.core-cfg ]; then \
        echo "Error: node is not configured! Run make <agent|gate|validator> first"; \
    else \
        ./scripts/validators.sh --add=${key}; \
    fi

validator-remove: stop
	@if [ "${key}" = "" ]; then \
	 	echo "Please use validator-remove key='YOUR_KEY'"; \
    elif [ ! -s ./.core-cfg ]; then \
        echo "Error: node is not configured! Run make <agent|gate|validator> first"; \
    else \
        ./scripts/validators.sh --remove=${key}; \
    fi