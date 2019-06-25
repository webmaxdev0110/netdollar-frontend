var Conf = require('../config/Config.js');
var Errors = require('../errors/Errors.js');
var Session = require('../models/Session.js');
var Helpers = require('../components/Helpers');

var Auth = {

    keypair: m.prop(false),
    balances: m.prop([]),
    assets: m.prop([]),
    payments: m.prop([]),
    wallet: m.prop(false),
    username: m.prop(false),
    ttl: m.prop(0),

    destroySession: function () {
        Auth.keypair(false);
        Auth.balances([]);
        Auth.assets([]);
        Auth.payments([]);
        Auth.wallet(false);
        Auth.username(false);
        Auth.ttl(0);

        //clear events
        Conf.SmartApi.Api.removeAllListeners();

        m.predestroySession();

        return m.route('/');
    },

    login: function (login, password) {

        var master = null;
        var wallet = null;
        var keypair = null;

        return this.loadAccountById(Conf.master_key)
            .then(function (master_info) {
                master = master_info;
                return Conf.SmartApi.Wallets.get({
                    username: login,
                    password: password,
                })
            })
            .then(function (wallet_data) {
                wallet = wallet_data;
                var is_admin = false;
                if (typeof master.signers != 'undefined') {
                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId()) {
                            is_admin = true;
                        }
                    });
                }
                if (!is_admin) {
                    throw new Error('Login/password combination is invalid');
                }
            })
            .then(function () {
                keypair = StellarSdk.Keypair.fromSeed(wallet.getKeychainData());
                Conf.SmartApi.setKeypair(keypair);
                return Conf.SmartApi.Admins.get({account_id: keypair.accountId()})
            })
            .catch(function (err) {
                console.error(err);
                m.onLoadingEnd();
                //if admin additional data not found on api
                if (err && typeof(err.description) != 'undefined' && typeof(err.message) != 'undefined'
                    && err.description === "admin" && err.message === 'ERR_NOT_FOUND') {
                    return swal({
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        html: '<h3>' + Conf.tr("Fill in your name and position") + '</h3>' +
                        '<input id="admin-name" class="swal2-input" placeholder="' + Conf.tr("Your name") + '" autofocus>' +
                        '<input id="admin-position" class="swal2-input" placeholder="' + Conf.tr("Your position") + '">' +
                        '<input id="admin-comment" class="swal2-input" placeholder="' + Conf.tr('Comment') + '">',
                        preConfirm: function () {
                            return new Promise(function (resolve, reject) {
                                var name     = document.querySelector('#admin-name').value;
                                var position = document.querySelector('#admin-position').value;
                                var comment  = document.querySelector('#admin-comment').value;

                                if (!name || !position || !comment) {
                                    reject(Conf.tr("Please fill in all fields"));
                                }

                                resolve({
                                    name    : name,
                                    position: position,
                                    comment : comment
                                });
                            })
                        }
                    })
                    .then(function (admin) {
                        return Conf.SmartApi.Admins.create({
                            account_id: keypair.accountId(),
                            name:       admin.name,
                            position:   admin.position,
                            comment:    admin.comment
                        })
                    });
                } else {
                    throw err;
                }
            })
            .then(function () {
                m.startComputation();
                Auth.wallet(wallet);
                Auth.keypair(keypair);
                Auth.username(wallet.username);
                Conf.SmartApi.setKeypair(Auth.keypair());
                return Conf.SmartApi.Api.getNonce()
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
    },

    mnemonicLogin: function (mnemonic) {

        if (!mnemonic.length) {
            return m.flashError(Conf.tr("Invalid mnemonic phrase"));
        }

        m.startComputation();
        Auth.wallet(null);
        Auth.username(null);
        m.endComputation();
        var seed = null;
        var keypair = null;
        for (var i = 0; i < Conf.mnemonic.langsList.length; i++) {
            try {
                seed = StellarSdk.getSeedFromMnemonic(mnemonic, Conf.mnemonic.langsList[i]);
                break;
            } catch (e) {
                continue;
            }
        }
        if (seed === null) {
            return m.flashError(Conf.tr("Invalid mnemonic phrase"));
        }

        return this.loadAccountById(Conf.master_key)
            .then(function (master) {
                var is_admin = false;
                if (typeof master.signers != 'undefined') {
                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(seed).accountId()) {
                            is_admin = true;
                        }
                    });
                }
                if (!is_admin) {
                    throw new Error(Conf.tr("Invalid mnemonic phrase"));
                }
            })
            .then(function () {
                keypair = StellarSdk.Keypair.fromSeed(seed);
                Conf.SmartApi.setKeypair(keypair);
                return Conf.SmartApi.Admins.get({account_id: keypair.accountId()})
            })
            .catch(function (err) {
                console.error(err);
                m.onLoadingEnd();
                //if admin additional data not found on api
                if (err && typeof(err.description) != 'undefined' && typeof(err.message) != 'undefined'
                    && err.description === "admin" && err.message === 'ERR_NOT_FOUND') {
                    return swal({
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        html: '<h3>' + Conf.tr("Fill in your name and position") + '</h3>' +
                        '<input id="admin-name" class="swal2-input" placeholder="' + Conf.tr("Your name") + '" autofocus>' +
                        '<input id="admin-position" class="swal2-input" placeholder="' + Conf.tr("Your position") + '">' +
                        '<input id="admin-comment" class="swal2-input" placeholder="' + Conf.tr('Comment') + '">',
                        preConfirm: function () {
                            return new Promise(function (resolve, reject) {
                                var name     = document.querySelector('#admin-name').value;
                                var position = document.querySelector('#admin-position').value;
                                var comment  = document.querySelector('#admin-comment').value;

                                if (!name || !position || !comment) {
                                    reject(Conf.tr("Please fill in all fields"));
                                }

                                resolve({
                                    name    : name,
                                    position: position,
                                    comment : comment
                                });
                            })
                        }
                    })
                        .then(function (admin) {
                            return Conf.SmartApi.Admins.create({
                                account_id: keypair.accountId(),
                                name:       admin.name,
                                position:   admin.position,
                                comment:    admin.comment
                            })
                        });
                } else {
                    throw err;
                }
            })
            .then(function () {
                m.startComputation();
                Auth.keypair(keypair);
                Conf.SmartApi.setKeypair(Auth.keypair());
                return Conf.SmartApi.Api.getNonce()
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
    },

    registration: function (login, password) {
        var accountKeypair = StellarSdk.Keypair.random();
        return Conf.SmartApi.Wallets.create({
            username: login,
            password: password,
            accountId: accountKeypair.accountId(),
            publicKey: accountKeypair.rawPublicKey().toString('base64'),
            keychainData: accountKeypair.seed(),
            mainData: 'mainData'
        });
    },

    logout: function () {
        window.location.href = '/';
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

    loadTransactionInfo: function (tid) {
        return Conf.horizon.transactions()
            .transaction(tid)
            .call()
    },

    loadAccountById: function (aid) {
        return Conf.horizon.accounts()
            .accountId(aid)
            .call();
    }
};

module.exports = Auth;