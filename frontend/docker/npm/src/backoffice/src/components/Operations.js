var Conf = require('../config/Config');
var Auth = require('../models/Auth');

var Operations = {

    getAdminsList: function () {
        var admins = [];
        return new Promise(function (resolve, reject) {
            Conf.horizon.accounts().accountId(Conf.master_key)
                .call()
                .then(function (data) {
                    if (typeof data.signers == 'undefined') {
                        reject('Unexpected response');
                    }
                    data.signers.forEach(function (signer) {
                        if (
                            signer.weight == Conf.roles.admin &&
                            signer.signertype == StellarSdk.xdr.SignerType.signerAdmin().value
                        ) {
                            admins.push(signer.public_key);
                        }
                    });
                    resolve(admins);
                })
                .catch(function (error) {
                    reject(error);
                })
        });
    },

    getEmissionKeysList: function () {
        var emmission_keys = [];
        return new Promise(function (resolve, reject) {
            Conf.horizon.accounts().accountId(Conf.master_key)
                .call()
                .then(function (data) {
                    if (typeof data.signers == 'undefined') {
                        reject('Unexpected response');
                    }
                    data.signers.forEach(function (signer) {
                        if (
                            signer.weight == Conf.roles.emission &&
                            signer.signertype == StellarSdk.xdr.SignerType.signerEmission().value
                        ) {
                            emmission_keys.push(signer.public_key);
                        }
                    });
                    resolve(emmission_keys);
                })
                .catch(function (error) {
                    reject(error);
                })
        });
    },

    deleteMasterSigner: function (account_id) {
        m.onLoadingStart();
        var adminKeyPair = null;
        return m.getPromptValue(Conf.tr("Enter password"))
            .then(function (pwd) {
                return Conf.SmartApi.Wallets.get({
                    username: Auth.username(),
                    password: pwd
                })
            })
            .then(function (wallet) {
                adminKeyPair = StellarSdk.Keypair.fromSeed(wallet.getKeychainData());
                return Conf.horizon.loadAccount(Conf.master_key);
            })
            .then(source => {
                var tx = new StellarSdk.TransactionBuilder(source)
                    .addOperation(StellarSdk.Operation.setOptions({
                        signer: {
                            pubKey: account_id,
                            weight: 0,
                            signerType: StellarSdk.xdr.SignerType.signerGeneral().value
                        }
                    }))
                    .build();
                tx.sign(adminKeyPair);
                return Conf.horizon.submitTransaction(tx);
            })
            .then(function () {
                return m.onLoadingEnd();
            })
    },

    saveCommissionOperation: function (opts, flat, percent) {

        if (percent >= 100) {
            return m.flashError(Conf.tr('Maximum percent commission must be less than 100%'));
        }

        return Conf.horizon.loadAccount(Conf.master_key)
            .then(function (source) {
                var op = StellarSdk.Operation.setCommission(opts, flat.toString(), percent.toString());
                var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
                tx.sign(Auth.keypair());
                return Conf.horizon.submitTransaction(tx);
            })
            .then(function () {
                m.flashSuccess(Conf.tr("Saved successfully"));
            })
            .catch(err => {
                console.error(err);
                return m.flashError(Conf.tr('Can not save commission'));
            })
    },

    deleteCommissionOperation: function (opts) {

        return Conf.horizon.loadAccount(Conf.master_key)
            .then(function (source) {
                var op = StellarSdk.Operation.deleteCommission(opts);
                var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
                tx.sign(Auth.keypair());
                return Conf.horizon.submitTransaction(tx);
            })
            .then(function () {
                m.flashSuccess(Conf.tr("Deleted successfully"));
            })
            .catch(err => {
                console.error(err);
                return m.flashError(Conf.tr('Can not delete commission'));
            })
    },

    approveEnrollment: function (account_id, account_type, tx_trust, enrollment_id, e) {
        m.onLoadingStart();

        return Conf.horizon.loadAccount(Conf.master_key)
            .then(function (source) {
                var tx = new StellarSdk.TransactionBuilder(source)
                    .addOperation(StellarSdk.Operation.createAccount({
                        destination: account_id,
                        accountType: account_type
                    }))
                    .build();
                tx.sign(Auth.keypair());

                return Conf.horizon.submitTransaction(tx);
            })
            .then(function () {
                return Conf.horizon.submitTransaction(new StellarSdk.Transaction(tx_trust));
            })
            .then(function () {
                return Conf.SmartApi.Enrollments.approve({id:enrollment_id});
            })
            .then(function () {
                return m.flashSuccess(Conf.tr('Enrollment approved'));
            })
            .catch(function (error) {
                console.error(error);
                return m.flashApiError(error);
            })
            .then(function () {
                m.onLoadingEnd();
                m.route(m.route());
            });
    },

    makeEmission: function (account_id, amount, asset) {
        m.onLoadingStart();

        var username = '';
        var password = '';

        m.getPromptValue(Conf.tr("Enter emission auth username"))
            .then(function (entered_username) {
                username = entered_username;
                return m.getPromptValue(Conf.tr("Enter emission auth password"))
            })
            .then(function (entered_password) {
                password = entered_password;

                var xhrConfig = function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
                };

                return m.request({
                    method: "POST",
                    url: Conf.emission_host + '/' + Conf.emission_path,
                    config: xhrConfig,
                    data: {accountId: account_id, amount:amount, asset:asset}
                });
            })
            .then(function (response) {
                console.log(response);
                return m.flashSuccess(Conf.tr('Emission success'));
            })
            .catch(function(error){
                console.error(error);
                return m.flashError(Conf.tr('Cannot make emission'));
            }).then(function(){
                m.onLoadingEnd();
            })
    },

};
module.exports = Operations;