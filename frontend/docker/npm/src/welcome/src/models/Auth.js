var Conf = require('../config/Config.js');
var Errors = require('../errors/Errors.js');

var Auth = {

    setDefaults: function () {
        this.keypair    = m.prop(false);
        this.type       = m.prop(false);
        this.enrollment = m.prop(false);
    },

    userLogin: function (token) {

        Auth.type('user');
        Auth.keypair(StellarSdk.Keypair.random());
        Conf.SmartApi.setKeypair(Auth.keypair());

        return Conf.SmartApi.Enrollments.getForUser({token: token})
            .then(function (enrollment) {
                if (typeof enrollment.data != 'undefined') {
                    Auth.enrollment(enrollment.data);
                } else {
                    console.error('Unexpected response');
                    console.error(enrollment);
                    return m.flashError(Conf.tr('Service error'));
                }
            })
            .catch(error => {
                console.error(error);
                if (error.name === 'ApiError') {
                    return m.flashApiError(error);
                }

                return m.flashError(Conf.tr("Can not get enrollment"));
            })
    },

    agentLogin: function (company_code, token) {

        Auth.type('agent');
        Auth.keypair(StellarSdk.Keypair.random());
        Conf.SmartApi.setKeypair(Auth.keypair());

        return Conf.SmartApi.Enrollments.getForAgent({company_code: company_code, token: token})
            .then(function (enrollment) {
                if (typeof enrollment.data != 'undefined') {
                    Auth.enrollment(enrollment.data);
                } else {
                    console.error('Unexpected response');
                    console.error(enrollment);
                    return m.flashError(Conf.tr('Service error'));
                }
            })
            .catch(error => {
                console.error(error);
                if (error.name === 'ApiError') {
                    return m.flashApiError(error);
                }

                return m.flashError(Conf.tr("Can not get enrollment"));
            })
    },

    logout: function () {
        window.location.href = '/';
    },
};


Auth.setDefaults();

module.exports = Auth;