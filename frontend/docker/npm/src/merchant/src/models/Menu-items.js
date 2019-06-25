module.exports = [
    {
        name: 'Stores',
        route: '',
        icon: 'md md-attach-money',
        subItems: [
            {
                name: 'List',
                route: '/stores'
            },
            {
                name: 'Create',
                route: '/stores/create'
            }
        ],
    },
    {
        name: 'Transfer',
        route: '/transfer',
        icon: 'fa fa-money',
        subItems: null
    },
    {
        name: 'Payments',
        route: '/payments',
        icon: 'fa fa-list-ul',
        subItems: null
    },
    {
        name: 'Settings',
        route: '/settings',
        icon: 'fa fa-cogs',
        walletonly: true,
        subItems: null
    },
];