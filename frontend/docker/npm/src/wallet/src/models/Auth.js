var Conf = require('../config/Config.js');
var Errors = require('../errors/Errors.js');
var Session = require('../models/Session.js');
var Helpers = require('../components/Helpers');

var Auth = {
    setDefaults: function () {
        this.keypair = m.prop(false);
        this.type = m.prop(false);
        this.username = m.prop(false);
        this.balances = m.prop([]);
        this.assets = m.prop([]);
        this.payments = m.prop([]);
        this.wallet = m.prop(false);
        this.ttl = m.prop(0);
    },

    destroySession: function () {
        Auth.keypair(false);
        Auth.type(false);
        Auth.username(false);
        Auth.balances([]);
        Auth.assets([]);
        Auth.payments([]);
        Auth.wallet(false);
        Auth.ttl(0);

        //clear events
        Conf.SmartApi.Api.removeAllListeners();

        m.predestroySession();

        return m.route('/');
    },

    updateBalances: function (account_id) {

        var assets = [];
        var balances = [];
        var account = null;

        return getAnonymousAssets()
            .then(assets_list => {
                Object.keys(assets_list).map(function (index) {
                    if (assets_list[index].asset_type != 'native') {
                        assets.push(assets_list[index].asset_code);
                    }
                });

                // Use this function instead of load account to gather more data
                return Auth.loadAccountById(account_id);
            })
            .then(source => {

                var response = source.balances;
                Object.keys(response).map(function (index) {
                    if (response[index].asset_type != 'native') {
                        balances.push({
                            balance: response[index].balance,
                            asset: response[index].asset_code
                        });
                        assets.push(response[index].asset_code);
                    }
                });

                account = source;

            })
            .catch(err => {
                console.log(err);
                //step this err, because user can be not created yet (before first payment)
            })
            .then(function () {

                //only unique values
                var flags = {};
                assets = assets.filter(function (asset) {
                    if (flags[asset]) {
                        return false;
                    }
                    flags[asset] = true;
                    return true;
                });

                m.startComputation();
                Auth.balances(balances);
                Auth.assets(assets);
                m.endComputation();

                return account;
            })
    },

    login: function (login, password) {

        var master = null;
        var wallet = null;
        var authable = false;

        return this.loadAccountById(Conf.master_key)
            .then(function (master_data) {
                master = master_data;
                return Conf.SmartApi.Wallets.get({
                        username: login,
                        password: password,
                    });
            })
            .then(function (wallet_data) {
                wallet = wallet_data;
                return Auth.loadAccountById(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId());
            })
            .then(function (account_data) {
                var allow_types = [
                    StellarSdk.xdr.AccountType.accountAnonymousUser().value,
                    StellarSdk.xdr.AccountType.accountRegisteredUser().value
                ];
                if (account_data && typeof account_data.type_i != 'undefined') {
                    if (allow_types.indexOf(account_data.type_i) != -1) {
                        authable = true;
                    }
                }
            })
            .catch(function (err) {

                console.info(err);

                authable = true;
                //look like not created anonym user login, but it also can be admin
                if (typeof master.signers != 'undefined') {
                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId()) {
                            //its admin
                            authable = false;
                        }
                    });
                }
            })
            .then(function () {
                if (!authable) {
                    throw new Error('Login/password combination is invalid');
                }
            })
            .then(function() {
                return Auth.initAuthData(wallet);
            })
    },

    loginByPasswordHash: function (login, passwordHash) {
        return Conf.SmartApi.Wallets.get({
            username: login,
            passwordHash: passwordHash
        }).then(function(wallet) {
            return Auth.initAuthData(wallet);
        })
    },

    initAuthData: function (wallet) {
        m.startComputation();
        Auth.wallet(wallet);
        Auth.keypair(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()));
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

            var master = null;
            var authable = false;

            return Auth.loadAccountById(Conf.master_key)
                .then(function (master_data) {
                    master = master_data;
                    return Auth.loadAccountById(StellarSdk.Keypair.fromSeed(seed).accountId());
                })
                .then(function (account_data) {
                    var allow_types = [
                        StellarSdk.xdr.AccountType.accountAnonymousUser().value,
                        StellarSdk.xdr.AccountType.accountRegisteredUser().value
                    ];
                    if (account_data && typeof account_data.type_i != 'undefined') {
                        if (allow_types.indexOf(account_data.type_i) != -1) {
                            authable = true;
                        }
                    }
                })
                .catch(function (error) {
                    authable = true;
                    //look like not created anonym user login, but it also can be admin
                    if (typeof master.signers != 'undefined') {
                        master.signers.forEach(function (signer) {
                            if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                                signer.public_key == StellarSdk.Keypair.fromSeed(seed).accountId()) {
                                //its admin
                                authable = false;
                            }
                        });
                    }
                })
                .then(function () {
                    if (!authable) {
                        return reject(Conf.tr("Invalid mnemonic phrase"));
                    }
                })
                .then(function() {
                    Auth.keypair(StellarSdk.Keypair.fromSeed(seed));
                    Auth.username(null);
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
                .then(() => {
                    return resolve();
                })
        });
    },

    registration: function (accountKeypair, login, password) {
        return Conf.SmartApi.Wallets.create({
            username    : login,
            password    : password,
            accountId   : accountKeypair.accountId(),
            publicKey   : accountKeypair.rawPublicKey().toString('base64'),
            keychainData: accountKeypair.seed(),
            mainData    : 'mainData',
            phoneAsLogin: true,
            kdfParams   : {
                algorithm            : 'scrypt',
                bits                 : 256,
                n                    : 2,
                r                    : 8,
                p                    : 1,
                passwordHashAlgorithm: 'sha256',
                hashRounds           : Math.pow(2, 19)
            }
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
    },

    setListener: function (progressCB) {
        Conf.SmartApi.Wallets.on('process', function (status) {
            switch(status.type) {
                case 'progress':
                    if (progressCB && typeof progressCB === 'function') {
                        m.startComputation();
                        progressCB(status.progress);
                        m.endComputation();
                    }
                    break;

                case 'procedure':
                    m.onLoadingStart();
                    break;
            }
        });
    },

    removeListener: function () {
        Conf.SmartApi.Wallets.removeAllListeners('process'); // remove listeners for progress
    }
};

function getAnonymousAssets() {

    return m.request({method: "GET", url: Conf.horizon_host + '/' + Conf.assets_url})
        .then(response => {
            if (typeof response._embedded == 'undefined' || typeof response._embedded.records == 'undefined') {
                throw new Error(Conf.tr(Errors.assets_empty));
            }

            let assets_list = response._embedded.records;

            Object.keys(assets_list).forEach(function (key) {
                if (typeof assets_list[key].is_anonymous == 'undefined') {
                    delete assets_list[key];
                }
                if (!assets_list[key].is_anonymous) {
                    delete assets_list[key];
                }
            });

            return assets_list;
        });
}

Auth.setDefaults();

module.exports = Auth;