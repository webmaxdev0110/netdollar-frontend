var Conf = require('../../config/Config.js');
var Wrapper = require('../../components/Wrapper.js');
var Helpers = require('../../components/Helpers.js');
var Auth = require('../../models/Auth.js');

Array.prototype.last = function() {
    return this[this.length-1];
}

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.cards_count    = m.prop(1);
        this.cards_amount   = m.prop(100);
        this.cards_sum      = m.prop(this.cards_count() * this.cards_amount());

        this.getBalanceByAsset = function (asset_code) {

            var asset_balance = 0;
            Auth.balances().every(function(balance) {
                if (balance.asset_code == asset_code) {
                    asset_balance = balance.balance;
                    return false;
                }
                return true;
            });

            return asset_balance;
        };

        this.updateCardsSum = function (e) {
            m.startComputation();
            if (e.target.id == 'cards_count') {
                ctrl.cards_count(e.target.value);
            }
            if (e.target.id == 'cards_amount') {
                ctrl.cards_amount(e.target.value);
            }
            ctrl.cards_sum(ctrl.cards_count() * ctrl.cards_amount());
            m.endComputation();
        };

        this.generateCards = function (e) {
            e.preventDefault();

            m.onLoadingStart();

            if (ctrl.cards_count() > 100) {
                return m.flashError(Conf.tr('Max cards at time') + ': 100');
            }

            if (ctrl.cards_count() <= 0) {
                return m.flashError(Conf.tr('Check amount of cards parameter'));
            }

            var amount          = ctrl.cards_amount();
            var asset           = e.target.asset.value;
            var accounts_data   = {};
            Auth.initAgentBalances()
                .then(() => {
                    var balance = ctrl.getBalanceByAsset(e.target.asset.value);
                    if (balance < ctrl.cards_sum()) {
                        return Promise.reject(Conf.tr('Not enough balance'));
                    }

                    return Conf.horizon.loadAccount(Auth.keypair().accountId());
                })
                .then(function (source) {
                    var accountKeypair = null;
                    var txBuilder = new StellarSdk.TransactionBuilder(source);

                    for (var c = 0; c < ctrl.cards_count(); c++) {
                        accountKeypair = StellarSdk.Keypair.random();

                        accounts_data[accountKeypair.accountId()] = btoa(sjcl.encrypt(Auth.keypair().seed(), accountKeypair.seed()));
                        txBuilder.addOperation(StellarSdk.Operation.createAccount({
                            destination: accountKeypair.accountId(),
                            accountType: StellarSdk.xdr.AccountType.accountScratchCard().value,
                            asset: new StellarSdk.Asset(asset, Conf.master_key),
                            amount: parseFloat(amount).toFixed(2)
                        }));
                    }

                    var tx = txBuilder.build();
                    tx.sign(Auth.keypair());

                    return Conf.SmartApi.Cards.create({
                        tx: tx.toEnvelope().toXDR().toString("base64"),
                        data: JSON.stringify(accounts_data)
                    })
                })
                .then(function() {
                    return m.flashSuccess(Conf.tr('Success. Cards will be confirmed in few moments'))
                })
                .then(function(){
                    return Auth.initAgentBalances();
                })
                .catch(error => {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not generate cards"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };
    },

    view: function (ctrl) {
        return m.component(Wrapper, {
            title: Conf.tr('Cards'),
            subtitle: Conf.tr('This page allows to create prepaid cards that can be distributed physically'),
            tpl: <div class="row">
                <div class="col-lg-12">
                    <div class="panel panel-color panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">{Conf.tr('Create new prepaid cards')}</h3>
                        </div>
                        <div class="panel-body">
                            <div id="card_form">
                                <form role="form" onsubmit={ctrl.generateCards.bind(ctrl)}>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-group">
                                                <label for="select" class="control-label">{Conf.tr("Currency")}</label>
                                                    <select class="form-control" name="asset" id="asset">
                                                        {
                                                            Auth.assets().map(function (asset) {
                                                                return <option value={asset}>{asset}</option>
                                                            })
                                                        }
                                                    </select>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="form-group">
                                                <label class="control-label long-label"
                                                       for="cards_count">{Conf.tr('Amount of cards')}</label>
                                                <input class="vertical-spin form-control"
                                                       oninput={ctrl.updateCardsSum.bind(ctrl)}
                                                       min="1" max="100" step="1"
                                                       value={ctrl.cards_count()}
                                                       id="cards_count"
                                                       name="cards_count" type="number"/>
                                            </div>
                                        </div>
                                        <div style="float:left;"><h2 style="padding-top: 17px;">*</h2></div>
                                        <div class="col-md-2">
                                            <div class="form-group">
                                                <label class="control-label long-label"
                                                       for="cards_amount">{Conf.tr('Value of a card')}</label>
                                                <input class="vertical-spin form-control"
                                                       oninput={ctrl.updateCardsSum.bind(ctrl)}
                                                       min="1" max="10000" step="1"
                                                       value={ctrl.cards_amount()}
                                                       id="cards_amount"
                                                       name="cards_amount" type="number"/>
                                            </div>
                                        </div>
                                        <div style="float:left;"><h2 style="padding-top: 12px;">=</h2></div>
                                        <div class="col-md-2">
                                            <div class="form-group">
                                                <label class="control-label"
                                                       for="cards_amount">{Conf.tr('Total amount')}</label>
                                                <input class="vertical-spin form-control"
                                                       name="cards_sum" id="cards_sum"
                                                       disabled=""
                                                       value={ctrl.cards_sum()}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-2">
                                            <div class="form-group">
                                                <button type="submit"
                                                        class="btn btn-primary waves-effect w-md waves-light m-b-5">
                                                    {Conf.tr('Create')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        });
    }
};
