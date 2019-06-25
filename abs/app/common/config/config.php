<?php
$config = new \Phalcon\Config([
    'project'         => [
        'production'  => 0,
        'log'         => 1,
        'upload_dir'  => APP_PATH . 'public/uploads',
        'admin_email' => getenv('ADMIN_EMAIL'),
        'admin_name'  => 'Smartmoney'
    ],
    'db'              => [
        'adapter'  => 'Postgresql',
        'host'     => 'postgres',
        'username' => getenv('POSTGRES_USER'),
        'password' => getenv('POSTGRES_PASSWORD'),
        'name'     => 'abs',
    ],
    "smtp"            => [
        'host'     => 'smtp.gmail.com',
        'port'     => '465',
        'security' => 'ssl',
        'username' => 'attic.it.lab@gmail.com',
        'password' => 'atticlab/*-2020',
    ],
    'emission_module' => [
        'host'     => trim(getenv('EMISSION_HOST'), '/'),
        'username' => getenv('EMISSION_BA_USER'),
        'password' => getenv('EMISSION_BA_PASS'),
    ],
    'modules' => [
        'frontend'
    ],
    'master'          => [
        'public' => getenv('MASTER_KEY'),
    ],
    'curencies'       => [
        'default' => 'UAH'
    ],
    'roles'           => [
        'admin'    => 1,
        'emission' => 2,
    ],
    'analytics'       => [
        'onPage' => 10,
        'sort'   => 'desc',
    ],
    'agents'          => [
        'limits' => [
            'assets' => [
                'EUAH',
                'DUAH'
            ]
        ]
    ],
    'no_auth_routers' => [
        'index/signup',
        'index/login'
    ],
    'horizon'    => [
        'host' => trim(getenv('HORIZON_HOST'), '/'),
    ],
    'session' => [
        'lifetime' => 10*60
    ],
    'title' => 'ABS | SmartMoney',
    'link' => [
        'name' => 'AtticLab',
        'url' => 'http://atticlab.net/'
    ],
//    'allowed_languages' => ['en', 'ru', 'ua']
    'allowed_languages' => ['en', 'ua']
]);
