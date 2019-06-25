var Conf = require('./config/Config.js');

// Loading spinner
m.onLoadingStart = function () {
    document.getElementById('spinner').style.display = 'block';
};
m.onLoadingEnd = function () {
    document.getElementById('spinner').style.display = 'none';
};

// Wrapper for notification which stops animation
m.flashError = function (msg) {
    m.onLoadingEnd();
    $.Notification.notify('error', 'top center', Conf.tr("Error"), msg);
};
m.flashApiError = function (err) {
    console.error(err);

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
    "/": require('./pages/AgentLogin.js'),
    "/u": require('./pages/UserLogin.js'),
    "/agent": require('./pages/Agent.js'),
    "/user": require('./pages/User.js')
});