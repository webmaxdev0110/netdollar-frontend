var Conf     = require('../../config/Config.js'),
    Navbar   = require('../../components/Navbar.js'),
    Footer   = require('../../components/Footer.js'),
    Sidebar  = require('../../components/Sidebar.js'),
    Operations  = require('../../components/Operations'),
    Auth     = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.assets         = m.prop([]);
        this.is_manage      = m.prop(false);
        this.flat_fee       = m.prop(false);
        this.percent_fee    = m.prop(false);

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

        this.manageCommission = function (e) {
            e.preventDefault();
            m.startComputation();
            ctrl.is_manage(true);
            document.getElementById('asset').disabled = true;
            m.endComputation();

            var asset = new StellarSdk.Asset(e.target.asset.value, Conf.master_key);

            this.getGlobalAssetCommissions(asset)
                .then(commission => {
                    m.startComputation();
                    ctrl.flat_fee(commission.flat);
                    ctrl.percent_fee(commission.percent);
                    ctrl.is_manage(true);
                    m.endComputation();
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(Conf.tr('Can not get commissions'));
                })
        };

        this.closeManageForm = function () {
            m.startComputation();
            ctrl.is_manage(false);
            document.getElementById('asset').disabled = false;
            m.endComputation();
        };

        this.getGlobalAssetCommissions = function (asset) {

            m.startComputation();
            ctrl.flat_fee(0);
            ctrl.percent_fee(0);
            m.endComputation();

            return new Promise(function (resolve, reject) {
                return Conf.horizon.commission()
                    .forAsset(asset)
                    .call()
                    .then(commissions => {

                        var data = {};

                        data.flat    = 0;
                        data.percent = 0;

                        commissions.records.every(function(commission){
                            if (
                                !commission.hasOwnProperty('from') &&
                                !commission.hasOwnProperty('to') &&
                                !commission.hasOwnProperty('from_account_type_i') &&
                                !commission.hasOwnProperty('to_account_type_i')
                            ) {
                                data.flat    = commission.flat_fee;
                                data.percent = commission.percent_fee;

                                return false;
                            }

                            return true;
                        });
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    })
            });
        };

        this.saveAssetCommissions = function (e) {
            m.onLoadingStart();
            var opts = {};
            opts.asset = new StellarSdk.Asset(document.getElementById('asset').value.toString(), Conf.master_key);
            var flat    = document.getElementById('flat').value;
            var percent = document.getElementById('percent').value;

            return Operations.saveCommissionOperation(opts, flat, percent).then(function(){
                m.startComputation();
                ctrl.flat_fee(flat);
                ctrl.percent_fee(percent);
                m.endComputation();
            })

        };

        this.deleteAssetCommission = function (e) {
            m.onLoadingStart();
            var opts = {};
            opts.asset = new StellarSdk.Asset(document.getElementById('asset').value.toString(), Conf.master_key);

            return Operations.deleteCommissionOperation(opts).then(function(){
                ctrl.closeManageForm();
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
                        {
                            ctrl.assets().length ?
                                <div>
                                    <div class="panel panel-primary panel-border">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Select asset")}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <div class="col-lg-12">
                                                <form class="form-horizontal" role="form" method="post" onsubmit={ctrl.manageCommission.bind(ctrl)}>

                                                    <div class="form-group">
                                                        <label for="select" class="col-md-2 control-label">{Conf.tr("Currency")}</label>
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
                                                    {
                                                        ctrl.is_manage() ?
                                                            <div>
                                                                <div class="form-group">
                                                                    <label for="flat" class="col-md-2 control-label">{Conf.tr("Flat fee")}</label>
                                                                    <div class="col-md-8">
                                                                        <input class="form-control" type="number" min="0" placeholder="0.00" id="flat"
                                                                               value={ctrl.flat_fee()} />
                                                                    </div>
                                                                </div>

                                                                <div class="form-group">
                                                                    <label for="percent" class="col-md-2 control-label">{Conf.tr("Percent fee")}</label>
                                                                    <div class="col-md-8">
                                                                        <input class="form-control" type="number" min="0" placeholder="0.00" id="percent"
                                                                               value={ctrl.percent_fee()} />
                                                                    </div>
                                                                </div>

                                                                <div class="form-group m-b-0">
                                                                    <div class="col-md-offset-2 col-md-10">
                                                                        <div class="col-md-8">
                                                                            <button type="button" class="btn btn-inverse btn-custom waves-effect waves-light m-b-5 m-r-5"
                                                                                    onclick={ctrl.closeManageForm.bind(ctrl)}>
                                                                                {Conf.tr("Close")}
                                                                            </button>
                                                                            <button type="button" class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5 m-r-5"
                                                                                    onclick={ctrl.saveAssetCommissions.bind(ctrl)}>
                                                                                {Conf.tr("Save")}
                                                                            </button>
                                                                            {(ctrl.flat_fee() || ctrl.percent_fee()) ?
                                                                                <button type="button" class="btn btn-danger btn-custom waves-effect w-md waves-light m-b-5 m-r-5"
                                                                                        onclick={ctrl.deleteAssetCommission.bind(ctrl)}>
                                                                                    {Conf.tr("Delete")}
                                                                                </button>
                                                                                :
                                                                                ''
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            :
                                                            <div class="form-group m-b-0">
                                                                <div class="col-sm-offset-2 col-sm-8">
                                                                    <button
                                                                        type="submit"
                                                                        class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                        {Conf.tr("Manage")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                    }

                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                <div class="portlet">
                                    <div class="portlet-heading bg-warning">
                                        <h3 class="portlet-title">
                                            {Conf.tr('No currencies found')}
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
                                    <div id="bg-warning" class="panel-collapse collapse in">
                                        <div class="portlet-body">
                                            {Conf.tr('Please')}<a href='/currencies/create' config={m.route}> {Conf.tr("create")}</a>!
                                        </div>
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