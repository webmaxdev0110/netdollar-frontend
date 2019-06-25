module.exports = [
    {
        name: 'Home',
        route: '/home',
        icon: 'md md-dashboard',
        subItems: null
    },
    {
        name: 'Admins',
        route: '/admins',
        icon: 'md md-people',
        subItems: null
    },
    {
        name: 'Emission',
        route: '',
        icon: 'md md-attach-money',
        subItems: [
            {
                name: 'List',
                route: '/emission'
            },
            {
                name: 'Generate',
                route: '/emission/generate'
            },
            {
                name: 'Quick emission',
                route: '/emission/quickemission'
            }
        ]
    },
    {
        name: 'Companies',
        route: '',
        icon: 'md md-face-unlock',
        subItems: [
            {
                name: 'List',
                route: '/companies'
            },
            {
                name: 'Create',
                route: '/companies/create'
            }
        ]
    },
    {
        name: 'Analytics',
        route: '/analytics',
        icon: 'md md-trending-up',
        subItems: null
    },
    {
        name: 'Fee',
        route: '',
        icon: 'md md-content-cut',
        subItems: [
            {
                name: 'For assets (globally)',
                route: '/commissions/assets'
            },
            {
                name: 'For types',
                route: '/commissions/types'
            },
            {
                name: 'For accounts',
                route: '/commissions/accounts'
            },
            {
                name: 'Fee account',
                route: '/commissions/manage'
            }
        ]
    },
    {
        name: 'Currencies',
        route: '',
        icon: 'md md-import-export',
        subItems: [
            {
                name: 'List',
                route: '/currencies'
            },
            {
                name: 'Create',
                route: '/currencies/create'
            }
        ]
    },
    {
        name: 'Invoices',
        route: '',
        icon: 'md md-import-export',
        subItems: [
            {
                name: 'Statistics',
                route: '/invoices/statistics'
            }
        ]
    },
    {
        name: 'Bans',
        route: '',
        icon: 'md md-security',
        subItems: [
            {
                name: 'List',
                route: '/bans/list'
            },
            {
                name: 'Create',
                route: '/bans/create'
            }
        ]
    },
    {
        name: 'Agents',
        route: '',
        icon: 'md md-people-outline',
        subItems: [
            {
                name: 'Create',
                route: '/agents/create'
            },
            {
                name: 'Enrollments',
                route: '/agents/enrollments'
            },
            {
                name: 'Manage',
                route: '/agents/manage'
            }
        ]
    },
    {
        name: 'Registered',
        route: '',
        icon: 'md md-verified-user',
        subItems: [
            {
                name: 'List',
                route: '/registered'
            },
            {
                name: 'Create',
                route: '/registered/create'
            },
            {
                name: 'Enrollments',
                route: '/registered/enrollments'
            }
        ]
    },
    {
        name: 'Settings',
        route: '/settings',
        icon: 'fa fa-cogs',
        walletonly: true,
        subItems: null
    },
];