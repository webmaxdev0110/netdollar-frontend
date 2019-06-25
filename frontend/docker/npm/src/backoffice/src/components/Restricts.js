var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth');

var Session = require('../models/Session.js');

module.exports = {
    controller: function (account_id) {
        var ctrl = this;

        this.block_incoming = m.prop(false);
        this.block_outcoming = m.prop(false);
        this.restricts = m.prop(false);

        this.getTraits = function () {
            m.onLoadingStart();

            return Conf.horizon.accounts()
                .traits(account_id)
                .call()
                .then(traits => {
                    m.startComputation();
                    ctrl.block_incoming(traits.block_incoming_payments);
                    ctrl.block_outcoming(traits.block_outcoming_payments);
                    ctrl.restricts(true);
                    m.endComputation();
                })
                .then(() => {
                    m.onLoadingEnd();
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting data"));
                })
        };

        this.saveTraits = function (e) {
            e.preventDefault();

            Session.closeModal();
            m.onLoadingStart();
            m.getPromptValue(Conf.tr("Enter password to save limits"))
                .then(function (pwd) {
                    return Conf.SmartApi.Wallets.get({
                        username: Auth.username(),
                        password: pwd
                    })
                })
                .then(wallet => {
                    var admin_keypair = StellarSdk.Keypair.fromSeed(wallet.getKeychainData());
                    return Conf.horizon.restrictAgentAccount(account_id, ctrl.block_outcoming(), ctrl.block_incoming(), admin_keypair, Conf.master_key);
                })
                .then(() => {
                    m.onLoadingEnd();
                    m.flashSuccess(Conf.tr("Restricts saved successfully"))
                })
                .catch((error) => {
                    console.log(error);
                    if (error && typeof error.name != 'undefined' && error.name === 'ApiError') {
                        return m.flashError(Conf.tr('Wrong password'));
                    }
                    m.flashError(Conf.tr("Error saving restricts"));
                });
        };

        this.getTraits();

    },

    view: function (ctrl, account_id) {
        return <div class="panel panel-primary panel-border">
            <div class="panel-heading">
                <h3 class="panel-title">{Conf.tr("Restrictions for agent")} <span id="accountID">{account_id}</span></h3>
            </div>
            <div class="panel-body">
                {ctrl.restricts() ?
                    <div>
                        <div class="checkbox checkbox-primary">
                            {m("input", {
                                type: "checkbox",
                                id: "block_incoming",
                                onclick: m.withAttr('checked', ctrl.block_incoming),
                                checked: ctrl.block_incoming()
                            })}
                            <label for="block_incoming_payments">
                                {Conf.tr("Block incoming payments")}
                            </label>
                        </div>
                        <hr/>
                        <div class="checkbox checkbox-primary">

                            {m("input", {
                                type: "checkbox",
                                id: "block_outcoming",
                                onclick: m.withAttr('checked', ctrl.block_outcoming),
                                checked: ctrl.block_outcoming()
                            })}
                            <label for="block_outcoming_payments">
                            {Conf.tr("Block outcoming payments")}
                        </label>
                        </div>
                        <hr/>
                            <button id="saveRestrictsForAccount" type="submit" onclick={ctrl.saveTraits.bind(ctrl)}
                                    class="btn btn-primary btn-custom waves-effect w-md waves-light m-r-5">{Conf.tr("Save")}</button>
                    </div>
                :
                    <div class="alert alert-dismissible alert-warning">
                        <button type="button" class="close" data-dismiss="alert">&times;</button>
                        <p>
                        {Conf.tr("Invalid account")}
                        </p>
                    </div>
                }
            </div>
        </div>
    }
}