ARGS = $(filter-out $@,$(MAKECMDGOALS))
MAKEFLAGS += --silent
CONTAINERS = $(shell docker ps -a -q)
VOLUMES = $(shell docker volume ls |awk 'NR>1 {print $2}')
list:
	sh -c "echo; $(MAKE) -p no_targets__ | awk -F':' '/^[a-zA-Z0-9][^\$$#\/\\t=]*:([^=]|$$)/ {split(\$$1,A,/ /);for(i in A)print A[i]}' | grep -v '__\$$' | grep -v 'Makefile'| sort"

#############################
# Docker machine states
#############################

start:
	docker-compose start

stop:
	docker-compose stop

state:
	docker-compose ps

build:
	@if [ ! -f ./.env ]; then\
	  	read -p "Enter domain for all services (w/o port and protocol):" domain; echo "DOMAIN=$$domain" >> ./.env; \
	  	read -p "Enter destination host for horizon proxy pass:" horizon_host; echo "HORIZON_NP_HOST=$$horizon_host" >> ./.env; \
	  	read -p "Enter destination host for riak proxy pass:" riak_host; echo "RIAK_NP_HOST=$$riak_host" >> ./.env; \
	  	read -p "Enter destination host for microservices proxy pass:" services_host; echo "SERVICES_NP_HOST=$$services_host" >> ./.env; \
	fi
	docker-compose build
	docker-compose up -d

attach:
	docker exec -i -t ${c} /bin/bash

purge:
	docker stop $(CONTAINERS)
	docker rm $(CONTAINERS)
	docker volume rm $(VOLUMES)
