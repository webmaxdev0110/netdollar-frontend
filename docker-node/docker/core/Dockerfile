FROM ubuntu:14.04

RUN apt-get update \
    && apt-get install -y software-properties-common \
    && add-apt-repository ppa:ubuntu-toolchain-r/test \
    && apt-get update \
	&& apt-get install -y git curl build-essential pkg-config autoconf automake libtool bison flex libpq-dev clang++-3.5 gcc-4.9 g++-4.9 cpp-4.9 git postgresql

WORKDIR /vhosts

RUN git config --global url."https://attic_lab:DhDXz6QS7338EwjccjdA@bitbucket.org/".insteadOf "https://bitbucket.org/"
RUN git clone -b smart-0.1.0 --depth 1 https://bitbucket.org/atticlab/smart-core.git core

WORKDIR /vhosts/core

# g++-4.9 is required, so we need to replace symlink
RUN rm /usr/bin/g++ && ln -s /usr/bin/g++-4.9 /usr/bin/g++

RUN git submodule init \
	&& git submodule update \
	&& ./autogen.sh \
	&& ./configure \
	&& make \
	&& make install

RUN mkdir /scripts

COPY ./scripts /scripts

CMD ["/scripts/entrypoint.sh"]
