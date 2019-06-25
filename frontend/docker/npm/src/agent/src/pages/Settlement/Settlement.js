var Conf = require('../../config/Config.js');
var Wrapper = require('../../components/Wrapper.js');
var Auth = require('../../models/Auth.js');

var Settlement = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair() || Auth.type() != 'settlement') {
            return m.route('/');
        }

        this.settlement = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            return Conf.horizon.loadAccount(Auth.keypair().accountId())
                .then(function (source) {
                    var tx = new StellarSdk.TransactionBuilder(source)
                        .addOperation(StellarSdk.Operation.payment({
                            destination: Conf.master_key,
                            amount: parseFloat(e.target.amount.value).toFixed(2).toString(),
                            asset: new StellarSdk.Asset(e.target.asset.value, Conf.master_key)
                        }))
                        .build();

                    tx.sign(Auth.keypair());

                    return Conf.horizon.submitTransaction(tx);
                })
                .catch(error => {
                    console.error(error);
                    return m.flashError(Conf.tr("Can not make settlement"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

    },

    view: function (ctrl) {
        return m.component(Wrapper, {
            title: Conf.tr("Settlement"),
            tpl: <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="panel panel-color panel-primary">
                                <div class="panel-heading">
                                    <h3 class="panel-title">{Conf.tr("Make settlement")}</h3>
                                </div>
                                <div class="panel-body">
                                    <form class="form-horizontal" onsubmit={ctrl.settlement.bind(ctrl)}>

                                        <div class="form-group">
                                            <div class="col-xs-4">
                                                <label for="">{Conf.tr("Amount")}:</label>
                                                <input class="form-control" type="number" required="required"
                                                       id="amount"
                                                       min="0.01"
                                                       step="0.01"
                                                       placeholder="0.00"
                                                       name="amount"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-4">
                                                <select name="asset" class="form-control">
                                                    {Auth.assets().map(function (asset) {
                                                        return <option>{asset}</option>
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <div class="form-group m-t-20">
                                            <div class="col-sm-7">
                                                <button
                                                    class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                    type="submit">
                                                    {Conf.tr("Submit")}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        });
    }
};