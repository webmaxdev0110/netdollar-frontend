var Conf    = require('../config/Config.js'),
    Auth    = require('../models/Auth'),
    Helpers = require('../components/Helpers'),
    Operations = require('../components/Operations');

module.exports = {
    controller: function(direction, inputs) {
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

        this.manageCommission = function (direction, e) {
            e.preventDefault();
            var from_account;
            var from_type;
            var to_account;
            var to_type;
            if (e.target.from_acc) {
                from_account = e.target.from_acc.value;
            }
            if (e.target.from_type) {
                from_type = e.target.from_type.value;
            }
            if (e.target.to_acc) {
                to_account = e.target.to_acc.value;
            }
            if (e.target.to_type) {
                to_type = e.target.to_type.value;
            }
            if (!from_account && !from_type && !to_account && !to_type) {
                return m.flashError(Conf.tr('Check require params'));
            }
            if (from_account) {
                if(!StellarSdk.Keypair.isValidPublicKey(from_account)) {
                    return m.flashError(Conf.tr('Bad account id'));
                }
            }
            if (to_account) {
                if(!StellarSdk.Keypair.isValidPublicKey(to_account)) {
                    return m.flashError(Conf.tr('Bad account id'));
                }
            }
            var asset = new StellarSdk.Asset(e.target.asset.value, Conf.master_key);
            this.getCommissions(from_account || to_account, from_account, to_account, from_type, to_type, asset, direction)
                .then(commission => {
                    m.startComputation();
                    ctrl.freezeCommissionParameters();
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

        this.getCommissions = function (target, from, to, from_type, to_type, asset, direction) {

            if(!StellarSdk.Keypair.isValidPublicKey(target)) {
                return m.flashError(Conf.tr('Bad account id'));
            }

            m.startComputation();
            ctrl.flat_fee(0);
            ctrl.percent_fee(0);
            m.endComputation();
            return new Promise(function (resolve, reject) {
                return Conf.horizon.commission()
                    .forAccount(target)
                    .forAsset(asset)
                    .call()
                    .then(commissions => {

                        var data = {};

                        data.flat    = 0;
                        data.percent = 0;

                        commissions.records.every(function(commission){
                            switch(direction){
                                case Conf.directions[0] :
                                    if (
                                        commission.hasOwnProperty('from') &&
                                        !commission.hasOwnProperty('to') &&
                                        !commission.hasOwnProperty('from_account_type_i') &&
                                        !commission.hasOwnProperty('to_account_type_i')
                                    ) {
                                        data.flat    = commission.flat_fee;
                                        data.percent = commission.percent_fee;

                                        return false;
                                    }

                                    break;

                                case Conf.directions[1] :
                                    if(
                                        !commission.hasOwnProperty('from') &&
                                        commission.hasOwnProperty('to') &&
                                        !commission.hasOwnProperty('from_account_type_i') &&
                                        !commission.hasOwnProperty('to_account_type_i')
                                    ) {
                                        data.flat    = commission.flat_fee;
                                        data.percent = commission.percent_fee;

                                        return false;
                                    }

                                    break;

                                case Conf.directions[2] :
                                    if(
                                        commission.hasOwnProperty('from') && commission.from == from &&
                                        commission.hasOwnProperty('to') && commission.to == to &&
                                        !commission.hasOwnProperty('from_account_type_i') &&
                                        !commission.hasOwnProperty('to_account_type_i')
                                    ) {
                                        data.flat    = commission.flat_fee;
                                        data.percent = commission.percent_fee;

                                        return false;
                                    }

                                    break;

                                case Conf.directions[3] :
                                    if(
                                        commission.hasOwnProperty('from') && commission.from == from &&
                                        !commission.hasOwnProperty('to') &&
                                        !commission.hasOwnProperty('from_account_type_i') &&
                                        commission.hasOwnProperty('to_account_type_i') && commission.to_account_type_i == to_type
                                    ) {
                                        data.flat    = commission.flat_fee;
                                        data.percent = commission.percent_fee;

                                        return false;
                                    }

                                    break;

                                case Conf.directions[4] :
                                    if(
                                        !commission.hasOwnProperty('from') &&
                                        commission.hasOwnProperty('to') && commission.to == to &&
                                        commission.hasOwnProperty('from_account_type_i') && commission.from_account_type_i == from_type &&
                                        !commission.hasOwnProperty('to_account_type_i')
                                    ) {
                                        data.flat    = commission.flat_fee;
                                        data.percent = commission.percent_fee;

                                        return false;
                                    }

                                    break;
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

        this.freezeCommissionParameters = function(){
            m.startComputation();
            document.getElementById('asset').disabled =         true;
            document.getElementById('direction').disabled =     true;

            if (!!document.getElementById('from_acc')) {
                document.getElementById('from_acc').disabled =  true;
            }
            if (!!document.getElementById('to_acc')) {
                document.getElementById('to_acc').disabled =    true;
            }
            if (!!document.getElementById('from_type')) {
                document.getElementById('from_type').disabled = true;
            }
            if (!!document.getElementById('to_type')) {
                document.getElementById('to_type').disabled =   true;
            }
            m.endComputation();
        };

        this.unfreezeCommissionParameters = function(){
            m.startComputation();
            document.getElementById('asset').disabled           = false;
            document.getElementById('direction').disabled       = false;

            if (!!document.getElementById('from_acc')) {
                document.getElementById('from_acc').disabled    = false;
            }
            if (!!document.getElementById('to_acc')) {
                document.getElementById('to_acc').disabled      = false;
            }
            if (!!document.getElementById('from_type')) {
                document.getElementById('from_type').disabled   = false;
            }
            if (!!document.getElementById('to_type')) {
                document.getElementById('to_type').disabled     = false;
            }
            m.endComputation();
        };

        this.closeManageForm = function () {
            ctrl.unfreezeCommissionParameters();
            m.startComputation();
            ctrl.is_manage(false);
            m.endComputation();
        };

        this.saveCommissions = function (inputs, e) {
            m.onLoadingStart();
            var opts = {};
            if (inputs.from_acc) {
                opts.from = document.getElementById('from_acc').value;
            }
            if (inputs.to_acc) {
                opts.to = document.getElementById('to_acc').value;
            }
            if (inputs.from_type) {
                opts.from_type = document.getElementById('from_type').value;
            }
            if (inputs.to_type) {
                opts.to_type = document.getElementById('to_type').value;
            }
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

        this.deleteCommission = function (inputs, e) {
            m.onLoadingStart();
            var opts = {};
            if (inputs.from_acc) {
                opts.from = document.getElementById('from_acc').value;
            }
            if (inputs.to_acc) {
                opts.to = document.getElementById('to_acc').value;
            }
            if (inputs.from_type) {
                opts.from_type = document.getElementById('from_type').value;
            }
            if (inputs.to_type) {
                opts.to_type = document.getElementById('to_type').value;
            }
            opts.asset = new StellarSdk.Asset(document.getElementById('asset').value.toString(), Conf.master_key);

            return Operations.deleteCommissionOperation(opts).then(function(){
                ctrl.closeManageForm();
            })

        };
    },

    view: function(ctrl, direction, inputs) {
        return <div class="col-lg-12">
            <div class="panel panel-primary panel-border">
                <div class="panel-heading">
                    <h3 class="panel-title">{Conf.tr("Fee for direction")}: {Conf.tr(direction)}</h3>
                </div>
                <div class="panel-body">
                        <form class="form-horizontal" id="commission_form" role="form" method="post" onsubmit={ctrl.manageCommission.bind(ctrl, direction)}>

                            {inputs().from_acc ?
                                <div class="form-group">
                                    <label for="from_acc" class="col-md-2 control-label">{Conf.tr("From account")}</label>
                                    <div class="col-md-8">
                                        <input class="form-control" type="text" name="from_acc" id="from_acc" required="required" />
                                    </div>
                                </div>
                            :
                                ''
                            }

                            {inputs().from_type ?
                                <div class="form-group">
                                    <label for="select" class="col-md-2 control-label">{Conf.tr("From type")}</label>
                                    <div class="col-md-8">
                                        <select class="form-control" name="from_type" id="from_type">
                                            {Conf.account_types.map(function (type) {
                                                return <option value={type.code}>{Conf.tr(Helpers.capitalizeFirstLetter(type.name))}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                                :
                                ''
                            }

                            {inputs().to_acc ?
                                <div class="form-group">
                                    <label for="to_acc" class="col-md-2 control-label">{Conf.tr("To account")}</label>
                                    <div class="col-md-8">
                                        <input class="form-control" type="text" name="to_acc" id="to_acc" required="required" />
                                    </div>
                                </div>
                            :
                                ''
                            }

                            {inputs().to_type ?
                                <div class="form-group">
                                    <label for="select" class="col-md-2 control-label">{Conf.tr("To type")}</label>
                                    <div class="col-md-8">
                                        <select class="form-control" name="to_type" id="to_type">
                                            {Conf.account_types.map(function (type) {
                                                return <option value={type.code}>{Conf.tr(Helpers.capitalizeFirstLetter(type.name))}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                            :
                                ''
                            }

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

                            {ctrl.is_manage() ?
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
                                                        onclick={ctrl.saveCommissions.bind(ctrl, inputs())}>
                                                    {Conf.tr("Save")}
                                                </button>
                                                {(ctrl.flat_fee() || ctrl.percent_fee()) ?
                                                    <button type="button" class="btn btn-danger btn-custom waves-effect w-md waves-light m-b-5 m-r-5"
                                                            onclick={ctrl.deleteCommission.bind(ctrl, inputs())}>
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
    }
};