var Conf     = require('../../config/Config.js'),
    Navbar   = require('../../components/Navbar.js'),
    Footer   = require('../../components/Footer.js'),
    Sidebar  = require('../../components/Sidebar.js'),
    Helpers  = require('../../components/Helpers'),
    Auth     = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.balances     = m.prop(false);
        this.comm_keypair = m.prop(false);

        this.getCommissionAccountBalances = function () {
            m.onLoadingStart();
            m.getPromptValue(Conf.tr("Enter commission account seed"))
                .then(function (comm_seed) {
                    m.startComputation();
                    ctrl.comm_keypair(StellarSdk.Keypair.fromSeed(comm_seed));
                    m.endComputation();
                    return Auth.loadAccountById(ctrl.comm_keypair().accountId());
                })
                .then(account_data => {
                    m.startComputation();
                    ctrl.balances(account_data.balances);
                    m.endComputation();
                })
                .catch(err => {
                    console.error(err);
                    return m.flashError(Conf.tr('Can not get commission account balances'));
                })
                .then(() => {
                    m.onLoadingEnd();
                });
        };

        ctrl.getCommissionAccountBalances();

        this.withdraw = function (e) {
            e.preventDefault();
            if (!ctrl.comm_keypair()) {
                return m.flashError(Conf.tr('Can not get commission account data'));
            }
            m.onLoadingStart();
            if (!e.target.asset || !e.target.amount || !e.target.to_account) {
                return m.flashError(Conf.tr('Fill all required fields'));
            }
            if (!StellarSdk.Keypair.isValidPublicKey(e.target.to_account.value)) {
                return m.flashError(Conf.tr('Bad account id'));
            }
            // TODO use special method from nbu branch
            return Conf.horizon.loadAccount(ctrl.comm_keypair().accountId())
                .then(function (source) {
                    var memo = StellarSdk.Memo.text('wd_commission');
                    var tx = new StellarSdk.TransactionBuilder(source, {memo: memo})
                        .addOperation(StellarSdk.Operation.payment({
                            destination: e.target.to_account.value,
                            amount: parseFloat(e.target.amount.value).toFixed(2).toString(),
                            asset: new StellarSdk.Asset(e.target.asset.value, Conf.master_key)
                        }))
                        .build();

                    tx.sign(ctrl.comm_keypair());

                    return Conf.horizon.submitTransaction(tx);
                })
                .then(function(){
                    return ctrl.getCommissionAccountBalances();
                })
                .then(function(){
                    return m.flashSuccess(Conf.tr('Successful withdraw'));
                })
                .catch(function(err){
                    console.error(err);
                    return m.flashError(Conf.tr('Can not make withdraw from commission account'));
                });

        };
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {
                            ctrl.balances() && ctrl.comm_keypair() ?
                                <div class="row">
                                    <div class="col-lg-12">
                                        <div class="panel panel-border panel-primary">
                                            <div class="panel-heading">
                                                <h3 class="panel-title">{Conf.tr('Manage commission account balances')}</h3>
                                            </div>
                                            <div class="panel-body">
                                                <div class="col-lg-12">
                                                    <form class="form-horizontal" role="form" method="post" onsubmit={ctrl.withdraw.bind(ctrl)}>
                                                        <div class="form-group">
                                                            <label for="to_account" class="col-md-2 control-label">{Conf.tr("Withdraw to account")}</label>
                                                            <div class="col-md-8">
                                                                <input class="form-control" type="text" name="to_account" id="to_account" required="required" />
                                                            </div>
                                                        </div>
                                                        <div class="form-group">
                                                            <label for="amount" class="col-md-2 control-label">{Conf.tr("Amount")}</label>
                                                            <div class="col-md-8">
                                                                <input class="form-control" type="text" name="amount" id="amount" required="required" />
                                                            </div>
                                                        </div>
                                                        <div class="form-group">
                                                            <label for="select"
                                                                   class="col-md-2 control-label">{Conf.tr("Asset")}</label>
                                                            <div class="col-md-4">
                                                                <select class="form-control" name="asset" id="asset">
                                                                    {
                                                                        ctrl.balances().map(function (balance) {
                                                                            {
                                                                                return typeof balance.asset_code != 'undefined' ?
                                                                                    <option value={balance.asset_code}>{balance.asset_code} [{parseFloat(balance.balance).toFixed(2)}]</option>
                                                                                    :
                                                                                    '';
                                                                            }
                                                                        })
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="form-group">
                                                            <div class="col-md-offset-2 col-md-3">
                                                                <button type="submit"
                                                                        class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                    {Conf.tr('Make withdraw')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                <div class="portlet">
                                    <div class="portlet-heading bg-warning">
                                        <h3 class="portlet-title">
                                            {Conf.tr('Wait for loading commission account data')}...
                                        </h3>
                                        <div class="portlet-widgets">
                                            <a data-toggle="collapse" data-parent="#accordion1" href="#bg-warning">
                                                <i class="ion-minus-round"></i>
                                            </a>
                                            <span class="divider"></span>
                                            <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                        </div>
                                        <div class="clearfix"></div>
                                    </div>
                                </div>
                        }
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};