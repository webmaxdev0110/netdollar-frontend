<?php

namespace App\Lib;

class Helpers
{

    public static function getMenuItems(){

        $menu_items = [];

        $menu_items['Main'] = [
            'href'     => '/',
            'icon'      => 'md md-dashboard',
            'subItems'  => null,
        ];

        $menu_items['Transactions'] = [
            'href'     => '#',
            'icon'      => 'md md-people-outline',
            'subItems'  => [
                '/tx/index' => [
                    'locale'     => 'List'
                ],
                '/tx/create' => [
                    'locale'     => 'Create'
                ]
            ],
        ];

        return $menu_items;

    }
}