FROM golang:1.6

RUN apt-get update && apt-get install -y \
	git \
	&& go get github.com/constabulary/gb/...

WORKDIR /vhosts

RUN git config --global url."https://attic_lab:DhDXz6QS7338EwjccjdA@bitbucket.org/".insteadOf "https://bitbucket.org/" \
	&& git clone -b smart-0.1.1 --depth 1 https://bitbucket.org/atticlab/horizon.git horizon

WORKDIR /vhosts/horizon

RUN gb vendor restore
RUN gb build

COPY ./entrypoint.sh /

CMD ["/entrypoint.sh"]
