var Conf = require('./config/Config.js');
var Auth = require('./models/Auth.js');
var Session = require('./models/Session.js');
var queue = require('queue');
var q = queue();

// Loading spinner
m.onLoadingStart = function () {
    q.push(true);
    document.getElementById('spinner').style.display = 'block';
};
m.onLoadingEnd = function () {
    q.pop();
    if (!q.length) {
        document.getElementById('spinner').style.display = 'none';
    }
};

m.predestroySession = function () {
    q = queue();
    Session.closeModal();
    jCloseAll();
    document.getElementById('spinner').style.display = 'none';
};

// Wrapper for notification which stops animation
m.flashError = function (msg) {
    m.onLoadingEnd();
    $.Notification.notify('error', 'top center', Conf.tr("Error"), msg);
};
m.flashApiError = function (err) {
    console.error(err);

    if (err && typeof err.message != 'undefined' && err.message == 'ERR_BAD_SIGN') {
        return Auth.destroySession();
    }
    m.onLoadingEnd();
    if (!err.message) {
        console.error('Unexpected ApiError response');

        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr('Service error'));
    }

    switch (err.message) {
        case 'ERR_UNKNOWN':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Unknown error") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_BAD_SIGN':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Bad sign") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_BAD_TYPE':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Bad account type for this operation") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_NOT_FOUND':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Record not found") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_ALREADY_EXISTS':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Record already exists") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_INV_EXPIRED':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Invoice expired") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_INV_REQUESTED':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Invoice has already been requested") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_BAD_PARAM':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Bad parameter") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_EMPTY_PARAM':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Empty parameter") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_SERVICE':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Service error") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_IP_BLOCKED':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("IP is blocked") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));
        case 'ERR_TX':
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Transaction error") + (Conf.tr(err.description) ? ': ' + Conf.tr(err.description) : ''));

        default:
            console.error('Unexpected ApiError message');
            return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr('Service error'));
    }
};
m.flashSuccess = function (msg) {
    m.onLoadingEnd();
    $.Notification.notify('success', 'top center', Conf.tr("Success"), msg);
};

m.getPromptValue = function (label) {
    return new Promise(function (resolve, reject) {
        jPrompt(label, '', Conf.tr("Message"), Conf.tr("OK"), Conf.tr("Cancel"), function (result) {
            if (result) {
                resolve(result);
            } else {
                reject(new Error(Conf.tr("Empty password")));
            }
        });
    });
};


// Routing
m.route.mode = 'pathname';
m.route(document.getElementById('app'), "/", {
    "/": require('./pages/Login.js'),
    "/recovery": require('./pages/Recovery.js'),
    "/sign": require('./pages/Sign.js'),
    "/home": require('./pages/Home.js'),
    "/settings" : require('./pages/Settings/Settings.js'),
    "/admins" : require('./pages/Admins/Admins.js'),
    "/emission" : require('./pages/Emission/List.js'),
    "/emission/generate" : require('./pages/Emission/Generate.js'),
    "/companies" : require('./pages/Companies/List.js'),
    "/companies/create" : require('./pages/Companies/Create.js'),
    "/analytics" : require('./pages/Analytics/Index.js'),
    "/analytics/account/:accountId" : require('./pages/Analytics/Account.js'),
    "/commissions/assets" : require('./pages/Commission/Assets.js'),
    "/commissions/types" : require('./pages/Commission/Types.js'),
    "/commissions/accounts" : require('./pages/Commission/Accounts.js'),
    "/commissions/manage" : require('./pages/Commission/Manage.js'),
    "/currencies" : require('./pages/Currencies/List.js'),
    "/currencies/create" : require('./pages/Currencies/Create.js'),
    "/invoices/statistics" : require('./pages/Invoices/Statistics'),
    "/bans/list" : require('./pages/Bans/List.js'),
    "/bans/create" : require('./pages/Bans/Create.js'),
    "/agents/manage" : require('./pages/Agents/Manage.js'),
    "/agents/create" : require('./pages/Agents/Create.js'),
    "/agents/enrollments" : require('./pages/Agents/Enrollments.js'),
    "/registered" : require('./pages/Registered/List.js'),
    "/registered/create" : require('./pages/Registered/Create.js'),
    "/registered/enrollments" : require('./pages/Registered/Enrollments.js'),
    "/emission/quickemission" : require('./pages/Emission/Quickemission.js'),
});