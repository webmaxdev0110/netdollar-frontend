#!/bin/bash

touch /logs/php_errors.log

chown www-data:www-data /logs/php_errors.log

crontab /crontab_file

cron

/usr/local/bin/php /app/app/cli/cli.php index paymentshandler &

php-fpm