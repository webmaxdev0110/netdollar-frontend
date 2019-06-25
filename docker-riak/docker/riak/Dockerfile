FROM ubuntu:trusty

RUN \
    # Install Java 8
    sed -i.bak 's/main$/main universe/' /etc/apt/sources.list \
    && apt-get update -qq && apt-get install -y software-properties-common curl \
    && apt-add-repository ppa:webupd8team/java -y && apt-get update -qq \
    && echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections \
    && apt-get install -y oracle-java8-installer \

    # Install Riak
    && curl -fsSL "https://packagecloud.io/install/repositories/basho/riak/script.deb" > /tmp/riak_setup.sh \
    && chmod +x /tmp/riak_setup.sh && /tmp/riak_setup.sh \
    && apt-get install -y supervisor riak=2.0.5-1 \

    # Cleanup
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN locale-gen en_US en_US.UTF-8

COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./entrypoint.sh /
COPY ./ssl-cert /etc/riak

CMD ["/entrypoint.sh"]
