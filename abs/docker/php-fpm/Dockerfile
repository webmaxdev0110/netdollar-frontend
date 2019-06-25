FROM php:5.6-fpm

# install phpredis extension
ENV PHPREDIS_VERSION 2.2.7

RUN apt-get update && apt-get install -y \
    git cron\
    # Postgres
    libpq-dev \
    postgresql-client \
    unzip \
    && docker-php-ext-install pgsql \
    && docker-php-ext-install pdo_pgsql \
    # Phalcon
    && git clone --depth=1 -b 2.0.x git://github.com/phalcon/cphalcon.git /usr/local/src/cphalcon \
    && cd /usr/local/src/cphalcon/build && ./install \
    && echo "extension=phalcon.so" > /usr/local/etc/php/conf.d/25-phalcon.ini \
    # install ed25519
    && git clone git://github.com/wedancedalot/php-ed25519-ext.git \
    && cd php-ed25519-ext && phpize && ./configure && make && make install \
    && echo "extension=ed25519.so" > /usr/local/etc/php/conf.d/30-ed25519.ini

# Inject php conf
COPY config/php.ini /usr/local/etc/php/

# Oracle instantclient
ADD inc /tmp

# Install Oracle Instantclient
RUN apt-get update && apt-get install -y libaio1 libaio-dev \
    && mkdir /opt/oracle \
    && unzip /tmp/instantclient-basic-linux.x64-12.1.0.2.0.zip -d /opt/oracle \
    && unzip /tmp/instantclient-sdk-linux.x64-12.1.0.2.0.zip -d /opt/oracle \
    && ln -s /opt/oracle/instantclient_12_1/libclntsh.so.12.1 /opt/oracle/instantclient_12_1/libclntsh.so \
    && ln -s /opt/oracle/instantclient_12_1/libclntshcore.so.12.1 /opt/oracle/instantclient_12_1/libclntshcore.so \
    && ln -s /opt/oracle/instantclient_12_1/libocci.so.12.1 /opt/oracle/instantclient_12_1/libocci.so \
    && echo 'instantclient,/opt/oracle/instantclient_12_1' | pecl install oci8-2.0.10 \
    && docker-php-ext-configure pdo_oci --with-pdo-oci=instantclient,/opt/oracle/instantclient_12_1,12.1 \
    && docker-php-ext-install pdo_oci \
    && docker-php-ext-enable oci8

# Add crontab file in the cron directory
COPY config/crontab /crontab_file

COPY ./entrypoint.sh /

CMD ["/entrypoint.sh"]