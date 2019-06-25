var Conf = require('../config/Config.js'),
    Errors = require('../errors/Errors.js'),
    Session = require('../models/Session.js'),
    Helpers = require('../components/Helpers');

var Auth = {

    keypair:    m.prop(false),
    type:       m.prop(false),
    assets:     m.prop([]),
    balances:   m.prop([]),
    wallet:     m.prop(false),
    username:   m.prop(false),
    ttl:        m.prop(0),

    destroySession: function () {

        Auth.keypair(false);
        Auth.type(false);
        Auth.assets([]);
        Auth.balances([]);
        Auth.wallet(false);
        Auth.username(false);
        Auth.ttl(0);

        //clear events
        Conf.SmartApi.Api.removeAllListeners();

        m.predestroySession();

        return m.route('/');
    },

    initAgentAssets: function () {
        return Auth.loadAccountById(Auth.keypair().accountId())
            .then(account_data => {
                m.startComputation();
                Auth.assets([]);
                account_data.balances.map(function(balance) {
                    if (typeof balance.asset_code != 'undefined') {
                        Auth.assets().push(balance.asset_code);
                    }
                });
                m.endComputation();
            })
    },

    initAgentBalances: function () {
        return Auth.loadAccountById(Auth.keypair().accountId())
            .then(account_data => {
                m.startComputation();
                Auth.balances([]);
                account_data.balances.map(function(balance) {
                    if (typeof balance.asset_code != 'undefined') {
                        Auth.balances().push(balance);
                    }
                });
                m.endComputation();
            })
    },

    updatePassword: function (old_pwd, new_pwd) {
        return Conf.SmartApi.Wallets.get({
            username: Auth.username(),
            password: old_pwd
        }).then(function (wallet) {
            return wallet.updatePassword({
                newPassword: new_pwd,
                secretKey: Auth.keypair()._secretKey.toString('base64')
            });
        }).then(function (wallet) {
            Auth.wallet(wallet);
        })
    },

    update: function (data) {
        return Auth.wallet().update({
            update: data,
            secretKey: Auth.keypair()._secretKey.toString('base64')
        });
    },

    loadAccountById: function (id) {
        return Conf.horizon.accounts()
            .accountId(id)
            .call();
    },

    login: function (login, password) {

        var wallet_data = null;

        return Conf.SmartApi.Wallets.get({
                username: login,
                password: password,
            })
            .then(function (wallet) {
                wallet_data = wallet;

                return Auth.loadAccountById(StellarSdk.Keypair.fromSeed(wallet_data.getKeychainData()).accountId());
            }).then(function (account_data) {

                m.startComputation();
                switch (account_data.type_i) {
                    case StellarSdk.xdr.AccountType.accountDistributionAgent().value:
                        Auth.type('distribution');
                        break;
                    case StellarSdk.xdr.AccountType.accountSettlementAgent().value:
                        Auth.type('settlement');
                        break;
                    default:
                        m.endComputation();
                        return m.flashError(Conf.tr('Bad account type'));
                }

                Auth.wallet(wallet_data);
                Auth.keypair(StellarSdk.Keypair.fromSeed(wallet_data.getKeychainData()));
                Auth.username(wallet_data.username);
                Conf.SmartApi.setKeypair(Auth.keypair());
                Conf.SmartApi.Api.getNonce()
                    .then(() => {
                        return Auth.initAgentAssets();
                    })
                    .then(() => {
                        return Auth.initAgentBalances();
                    })
                    .then(() => {
                        m.endComputation();
                        Conf.SmartApi.Api.on('tick', function (ttl) {
                            Auth.ttl(ttl);
                            if (Auth.ttl() <= 0) {
                                return Auth.destroySession();
                            }
                            if (document.querySelector("#spinner-time")) {
                                document.querySelector('#spinner-time').innerHTML = Helpers.getTimeFromSeconds(Auth.ttl());
                            }
                        });
                    });

                //set stream for balances update
                Conf.horizon.payments()
                    .forAccount(Auth.keypair().accountId())
                    .cursor('now')
                    .stream({
                        onmessage: function (message) {
                            // Update user balance
                            return Auth.initAgentBalances();
                        },
                        onerror: function () {
                            console.log('Cannot get payment from stream');
                        }
                    });
            })
    },

    mnemonicLogin: function (mnemonic) {
        return new Promise(function (resolve, reject) {
            m.startComputation();
            Auth.wallet(null);
            var seed = null;
            for (var i = 0; i < Conf.mnemonic.langsList.length; i++) {
                try {
                    seed = StellarSdk.getSeedFromMnemonic(mnemonic, Conf.mnemonic.langsList[i]);
                    break;
                } catch (e) {
                    continue;
                }
            }
            if (seed === null) {
                return reject(Conf.tr("Invalid mnemonic phrase"));
            }

            var authable = false;

            return Auth.loadAccountById(StellarSdk.Keypair.fromSeed(seed).accountId())
                .then(function (account_data) {
                    switch (account_data.type_i) {
                        case StellarSdk.xdr.AccountType.accountDistributionAgent().value:
                            Auth.type('distribution');
                            authable = true;
                            break;
                        case StellarSdk.xdr.AccountType.accountSettlementAgent().value:
                            Auth.type('settlement');
                            authable = true;
                            break;
                    }
                })
                .then(function () {
                    if (!authable) {
                        return reject(Conf.tr("Invalid mnemonic phrase"));
                    }
                })
                .then(function () {
                    Auth.keypair(StellarSdk.Keypair.fromSeed(seed));
                    Auth.username(null);
                    Conf.SmartApi.setKeypair(Auth.keypair());
                    return Conf.SmartApi.Api.getNonce()
                        .then(() => {
                            return Auth.initAgentAssets();
                        })
                        .then(() => {
                            return Auth.initAgentBalances();
                        })
                        .then(() => {
                            m.endComputation();
                            Conf.SmartApi.Api.on('tick', function (ttl) {
                                Auth.ttl(ttl);
                                if (Auth.ttl() <= 0) {
                                    return Auth.destroySession();
                                }
                                if (document.querySelector("#spinner-time")) {
                                    document.querySelector('#spinner-time').innerHTML = Helpers.getTimeFromSeconds(Auth.ttl());
                                }
                            });
                        });
                })
                .then(() => {
                    return resolve();
                })
        });
    },

    logout: function () {
        window.location.href = "/";
    },

};

module.exports = Auth;