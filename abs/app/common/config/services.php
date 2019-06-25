<?php

# Register DB
$di->setShared('db', function () use ($config) {
    $adapter = '\Phalcon\Db\Adapter\Pdo\\' . $config->db->adapter;
    $connection = new $adapter([
        "host"     => $config->db->host,
        "username" => $config->db->username,
        "password" => $config->db->password,
        "dbname"   => $config->db->name,
    ]);

    return $connection;
});

# Mailer (requires composer component)
$di->setShared('mailer', function () use ($config) {
    $mailer = new \App\Lib\Mailer([
        'templates' => APP_PATH . 'common/emails/',
        'host'      => $config->smtp->host,
        'port'      => $config->smtp->port,
        'username'  => $config->smtp->username,
        'password'  => $config->smtp->password,
        'security'  => $config->smtp->security
    ]);

    if (!empty($config->project->admin_email) && !empty($config->project->admin_name)) {
        $mailer->setFrom($config->project->admin_email, $config->project->admin_name);
    }

    return $mailer;
});

# Logger
$di->setShared('logger', function () use ($config, $di) {
    $logger = new \Phalcon\Logger\Multiple;

    $logger->push(new \Phalcon\Logger\Adapter\File(ini_get('error_log')));
    $logger->push(new \Phalcon\Logger\Adapter\Stream('php://stdout'));
    $logger->push(new \App\Lib\Components\Logger\Db([
        'db'    => $di->getDb(),
        'table' => 'logs'
    ]));

    return $logger;
});

$di->setShared('crypt', function () use ($config) {
    $crypt = new \Phalcon\Crypt();
    $crypt->setMode(MCRYPT_MODE_CFB);
    $crypt->setKey($config->project->crypt_key);

    return $crypt;
});

// not sending cookies without disabling cookie encryption
$di->setShared('cookies', function() {
    $cookies = new \Phalcon\Http\Response\Cookies();
    $cookies->useEncryption(false);
    return $cookies;
});

# Session
$di->setShared('session', function () use ($config) {
    $params = [];

    if (!empty($config->project->sess_prefix)) {
        $params['uniqueId'] = $config->project->sess_prefix;
    }

    $session = new \Phalcon\Session\Adapter\Files($params);
    $session->start();

    return $session;
});

# Flash messaging
$di->setShared('flash', function () {
    return new \Phalcon\Flash\Session([
        'error'   => 'alert alert-danger',
        'warning' => 'alert alert-warning',
        'success' => 'alert alert-success',
        'notice'  => 'alert alert-info'
    ]);
});

# Config
$di->setShared('config', $config);