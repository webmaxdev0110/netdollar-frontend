var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Auth    = require('../../models/Auth'),
    Operations = require('../../components/Operations'),
    Sidebar = require('../../components/Sidebar.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.assets = m.prop([]);

        this.getAssets = function () {
            m.onLoadingStart();

            return Conf.horizon.assets()
                .call()
                .then((assets) => {
                    m.startComputation();
                    ctrl.assets(assets.records);
                    m.endComputation();
                })
                .catch(() => {
                    m.flashError(Conf.tr("Error requesting currencies"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

        this.getAssets();

        this.prepareMakeEmission = function (e) {
            e.preventDefault();

            m.onLoadingStart();
            if(!e.target.account_id){
                return m.flashError('Fill account_id field');
            }
            if(!e.target.asset){
                return m.flashError('Fill asset field');
            }
            if(!e.target.amount){
                return m.flashError('Fill amount field');
            }

            if(!StellarSdk.Keypair.isValidPublicKey(e.target.account_id.value.toString())) {
                return m.flashError(Conf.tr('Bad account id'));
            }

            return Conf.horizon.accounts().accountId(e.target.account_id.value.toString())
                .call()
                .then((account) => {
                    if(!account || typeof account.type_i == 'undefined' || account.type_i != StellarSdk.xdr.AccountType.accountDistributionAgent().value) {
                        return m.flashError(Conf.tr('Check account id parameter'));
                    }

                    return Operations.makeEmission(e.target.account_id.value.toString(), parseInt(parseFloat(e.target.amount.value).toFixed(2)*100), e.target.asset.value.toString());

                }).catch(function(error){
                    console.error(error);
                    return m.flashError(Conf.tr('Check account id parameter'))
                })

            };

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="panel panel-color panel-primary">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr('Create payment document')}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="alert alert-info">
                                    {Conf.tr('This page allows to fund agent’s account quickly')}
                                </div>
                                <form method="post" class="form-horizontal" role="form" onsubmit={ctrl.prepareMakeEmission.bind(ctrl)}>
                                    <div class="form-group">
                                        <label for="description" class="col-sm-1 control-label">{Conf.tr('Account')}</label>
                                        <div class="col-md-8">
                                            <input name="account_id" class="form-control" placeholder={Conf.tr("Account ID")} required="required"/>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="amount" class="col-sm-1 control-label">{Conf.tr('Amount')}</label>
                                        <div class="col-md-8">
                                            <input type="number" min="0.01" step="0.01" class="form-control" id="amount" name="amount" placeholder={Conf.tr("Amount")} required="required"/>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="select" class="col-sm-1 control-label">{Conf.tr('Currency')}</label>
                                        <div class="col-md-8">
                                            <select class="form-control" name="asset" id="asset">
                                                {
                                                    ctrl.assets().map(function (asset) {
                                                        return <option value={asset.asset_code}>{asset.asset_code}</option>
                                                    })
                                                }
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-sm-offset-1 col-sm-11">
                                        <button type="submit" class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                            {Conf.tr('Submit')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};