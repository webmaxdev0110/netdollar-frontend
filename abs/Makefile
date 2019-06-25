ARGS = $(filter-out $@,$(MAKECMDGOALS))
MAKEFLAGS += --silent
CONTAINERS = $(shell docker ps -a -q)
VOLUMES = $(shell docker volume ls |awk 'NR>1 {print $2}')
COMPOSER_DIR = $(realpath $(PWD))

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
  	read -p "Enter master public key:" master_key; echo "MASTER_KEY=$$master_key" >> ./.env; \
  	read -p "Enter horizon host [with protocol and port(optional)]:" horizon_host; echo "HORIZON_HOST=$$horizon_host" >> ./.env; \
  	read -p "Enter emission host [with protocol and port(optional)]:" emission_host; echo "EMISSION_HOST=$$emission_host" >> ./.env; \
  	read -p "Enter emission basic auth username:" emission_ba_user; echo "EMISSION_BA_USER=$$emission_ba_user" >> ./.env; \
  	read -p "Enter emission basic auth password:" emission_ba_pass; echo "EMISSION_BA_PASS=$$emission_ba_pass" >> ./.env; \
  	read -p "Enter admin email:" admin_email; echo "ADMIN_EMAIL=$$admin_email" >> ./.env; \
	fi
	docker-compose build
	docker-compose up -d

	docker run --rm -v $(COMPOSER_DIR)/app:/app composer/composer --working-dir=/app install

build-hard:
	docker-compose build --no-cache
	docker-compose up -d

attach:
	docker exec -i -t ${c} /bin/bash

purge:
	docker stop $(CONTAINERS)
	docker rm $(CONTAINERS)
	docker volume rm $(VOLUMES)