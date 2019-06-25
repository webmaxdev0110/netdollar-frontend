var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth = require('../../models/Auth'),
    Helpers = require('../../components/Helpers'),
    Operations = require('../../components/Operations'),
    Session = require('../../models/Session.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.assets = m.prop([]);
        this.commissions = m.prop(false);
        this.selected_asset = m.prop(false);
        this.selected_type = m.prop(false);
        this.selected_type_text = m.prop('Unknown');

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

        this.setParams = function (e) {
            e.preventDefault();
            ctrl.setParamsProcess(e.target.type.value, e.target.asset.value);
        };

        this.setParamsProcess = function (type, asset) {

            ctrl.getTypeCommissions(type, asset)
                .then(function (commissions) {
                    m.startComputation();
                    ctrl.commissions(commissions);
                    ctrl.selected_asset(asset);
                    ctrl.selected_type(type);
                    ctrl.selected_type_text(Helpers.getTextAccountType(ctrl.selected_type()));
                    m.endComputation();
                })
                .catch(() => {
                    m.flashError(Conf.tr("Cannot get fees"));
                });
        };

        this.getTypeCommissions = function (account_type, asset_code) {

            var asset = new StellarSdk.Asset(asset_code, Conf.master_key);

            return new Promise(function (resolve, reject) {
                return Conf.horizon.commission()
                    .forAccountType(account_type.toString())
                    .forAsset(asset)
                    .call()
                    .then(commissions => {
                        var data = [];
                        //get commissions between types
                        commissions.records.map(function (commission) {
                            if (
                                !commission.hasOwnProperty('from') && !commission.hasOwnProperty('to') &&
                                commission.hasOwnProperty('from_account_type_i') && commission.from_account_type_i == account_type &&
                                commission.hasOwnProperty('to_account_type_i')
                            ) {

                                var commission_values = {
                                    flat: commission.flat_fee,
                                    percent: commission.percent_fee,
                                };

                                data[commission.to_account_type_i] = commission_values;
                                //get commission for from only
                            } else if (
                                !commission.hasOwnProperty('from') && !commission.hasOwnProperty('to') &&
                                commission.hasOwnProperty('from_account_type_i') && commission.from_account_type_i == account_type && !commission.hasOwnProperty('to_account_type_i')
                            ) {

                                var commission_values = {
                                    flat: commission.flat_fee,
                                    percent: commission.percent_fee,
                                };

                                data['from'] = commission_values;
                                //get commission for to only
                            } else if (
                                !commission.hasOwnProperty('from') && !commission.hasOwnProperty('to') && !commission.hasOwnProperty('from_account_type_i') &&
                                commission.hasOwnProperty('to_account_type_i') && commission.to_account_type_i == account_type
                            ) {

                                var commission_values = {
                                    flat: commission.flat_fee,
                                    percent: commission.percent_fee,
                                };

                                data['to'] = commission_values;
                            }
                        });
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    })
            });
        };

        this.saveTypesCommissions = function (e) {
            e.preventDefault();
            Session.closeModal();
            m.onLoadingStart();
            var opts = {};
            if (e.target.from) {
                opts.from_type = e.target.from.value;
            }
            if (e.target.to) {
                opts.to_type = e.target.to.value;
            }
            opts.asset = new StellarSdk.Asset(ctrl.selected_asset(), Conf.master_key);

            return Operations.saveCommissionOperation(opts, e.target.flat.value.toString(), e.target.percent.value.toString())
                .then(function () {
                    ctrl.setParamsProcess(opts.from_type || opts.to_type, ctrl.selected_asset());
                    m.onLoadingEnd();
                });
        };

        this.deleteTypesCommission = function (from, to, e) {
            m.onLoadingStart();
            var opts = {};

            if (typeof from != 'undefined' && from !== null) {
                opts.from_type = from.toString();
            }
            if (typeof to != 'undefined' && to !== null) {
                opts.to_type = to.toString();
            }

            opts.asset = new StellarSdk.Asset(ctrl.selected_asset(), Conf.master_key);

            return Operations.deleteCommissionOperation(opts)
                .then(function () {
                    ctrl.setParamsProcess(from || to, ctrl.selected_asset());
                    m.onLoadingEnd();
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
                                            <h3 class="panel-title">{Conf.tr("Select account type to edit fees")}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <div class="col-lg-12">
                                                <form class="form-horizontal" id="commission_form" role="form"
                                                      method="post" onsubmit={ctrl.setParams.bind(ctrl)}>
                                                    <div class="form-group">
                                                        <label for="select"
                                                               class="col-md-2 control-label">{Conf.tr("Type")}</label>
                                                        <div class="col-md-8">
                                                            <select class="form-control" name="type" id="type">
                                                                {Conf.account_types.map(function (type) {
                                                                    return <option
                                                                        value={type.code}>{Conf.tr(Helpers.capitalizeFirstLetter(type.name))}</option>
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label for="select"
                                                               class="col-md-2 control-label">{Conf.tr("Currency")}</label>
                                                        <div class="col-md-8">
                                                            <select class="form-control" name="asset" id="asset">
                                                                {
                                                                    ctrl.assets().map(function (asset) {
                                                                        return <option
                                                                            value={asset.asset_code}>{asset.asset_code}</option>
                                                                    })
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="form-group m-b-0">
                                                        <div class="col-sm-offset-2 col-sm-8">
                                                            <button
                                                                type="submit"
                                                                class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                {Conf.tr("Manage")}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                    {
                                        ctrl.commissions() ?
                                            <div class="card-box">
                                                <h4 class="m-t-0 header-title">
                                                    <b>{Conf.tr('Fee for type')}</b>: {Conf.tr(ctrl.selected_type_text())}
                                                    &nbsp;({ctrl.selected_asset()})</h4>
                                                <table class="table table-striped m-0">
                                                    <thead>
                                                    <tr>
                                                        <th>{Conf.tr('Asset')}</th>
                                                        <th>{Conf.tr('From')}</th>
                                                        <th>{Conf.tr('To')}</th>
                                                        <th>{Conf.tr('Flat')}</th>
                                                        <th>{Conf.tr('Percent')}</th>
                                                        <th>{Conf.tr('Manage')}</th>
                                                        <th>{Conf.tr('Delete')}</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {Conf.account_types.map(function (type) {
                                                        return <tr>
                                                            <td>
                                                                {ctrl.selected_asset()}
                                                            </td>
                                                            <td>
                                                                {Conf.tr(ctrl.selected_type_text())}
                                                            </td>
                                                            <td>
                                                                {Conf.tr(type.name)}
                                                            </td>
                                                            <td>
                                                                {ctrl.commissions()[type.code] && ctrl.commissions()[type.code].flat ? ctrl.commissions()[type.code].flat : '-'}
                                                            </td>
                                                            <td>
                                                                {ctrl.commissions()[type.code] && ctrl.commissions()[type.code].percent ? ctrl.commissions()[type.code].percent : '-'}
                                                            </td>
                                                            <td>
                                                                <button class="btn btn-primary waves-effect waves-light"
                                                                        onclick={function () {
                                                                            Session.modal(
                                                                                <form class="form-horizontal"
                                                                                      id="commission_form" role="form"
                                                                                      method="post"
                                                                                      onsubmit={ctrl.saveTypesCommissions.bind(ctrl)}>
                                                                                    <div class="form-group">
                                                                                        <label for="from"
                                                                                               class="col-md-2 control-label">{Conf.tr("From account type")}</label>
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="text"
                                                                                                required="required"
                                                                                                readonly="readonly"
                                                                                                value={Conf.tr(ctrl.selected_type_text())}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group">
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="hidden"
                                                                                                name="from" id="from"
                                                                                                required="required"
                                                                                                readonly="readonly"
                                                                                                value={ctrl.selected_type()}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group">
                                                                                        <label for="to"
                                                                                               class="col-md-2 control-label">{Conf.tr("To account type")}</label>
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="text"
                                                                                                required="required"
                                                                                                readonly="readonly"
                                                                                                value={Conf.tr(type.name)}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group">
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="hidden" name="to"
                                                                                                id="to"
                                                                                                required="required"
                                                                                                readonly="readonly"
                                                                                                value={type.code}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group">
                                                                                        <label for="flat"
                                                                                               class="col-md-2 control-label">{Conf.tr("Flat fee")}</label>
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="number" min="0"
                                                                                                placeholder="0.00"
                                                                                                name="flat"
                                                                                                value={ctrl.commissions()[type.code] && ctrl.commissions()[type.code].flat ? ctrl.commissions()[type.code].flat : 0}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group">
                                                                                        <label for="percent"
                                                                                               class="col-md-2 control-label">{Conf.tr("Percent fee")}</label>
                                                                                        <div class="col-md-8">
                                                                                            <input
                                                                                                class="form-control"
                                                                                                type="number" min="0"
                                                                                                placeholder="0.00"
                                                                                                name="percent"
                                                                                                value={ctrl.commissions()[type.code] && ctrl.commissions()[type.code].percent ? ctrl.commissions()[type.code].percent : 0}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="form-group m-b-0">
                                                                                        <div
                                                                                            class="col-sm-offset-2 col-sm-8">
                                                                                            <button
                                                                                                type="submit"
                                                                                                class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                                                {Conf.tr("Save")}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </form>
                                                                                , Conf.tr('Edit fees'))
                                                                        }}
                                                                >{Conf.tr('Manage')}</button>
                                                            </td>
                                                            <td>
                                                                {
                                                                    ctrl.commissions()[type.code] && ctrl.commissions()[type.code].flat ||
                                                                    ctrl.commissions()[type.code] && ctrl.commissions()[type.code].percent
                                                                        ?
                                                                        <button type="button"
                                                                                class="btn btn-danger btn-custom waves-effect w-md waves-light"
                                                                                onclick={ctrl.deleteTypesCommission.bind(ctrl, ctrl.selected_type(), type.code)}>
                                                                            {Conf.tr("Delete")}
                                                                        </button>
                                                                        :
                                                                        '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                    })}
                                                    {/*for from type only*/}
                                                    <tr>
                                                        <td>
                                                            {ctrl.selected_asset()}
                                                        </td>
                                                        <td>
                                                            {Conf.tr(ctrl.selected_type_text())}
                                                        </td>
                                                        <td>
                                                            -
                                                        </td>
                                                        <td>
                                                            {ctrl.commissions()['from'] && ctrl.commissions()['from'].flat ? ctrl.commissions()['from'].flat : '-'}
                                                        </td>
                                                        <td>
                                                            {ctrl.commissions()['from'] && ctrl.commissions()['from'].percent ? ctrl.commissions()['from'].percent : '-'}
                                                        </td>
                                                        <td>
                                                            <button class="btn btn-primary waves-effect waves-light"
                                                                    onclick={function () {
                                                                        Session.modal(
                                                                            <form class="form-horizontal"
                                                                                  id="commission_form" role="form"
                                                                                  method="post"
                                                                                  onsubmit={ctrl.saveTypesCommissions.bind(ctrl)}>
                                                                                <div class="form-group">
                                                                                    <label for="from"
                                                                                           class="col-md-2 control-label">{Conf.tr("From account type")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="text"
                                                                                            required="required"
                                                                                            readonly="readonly"
                                                                                            value={Conf.tr(ctrl.selected_type_text())}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="hidden" name="from"
                                                                                            id="from"
                                                                                            required="required"
                                                                                            readonly="readonly"
                                                                                            value={ctrl.selected_type()}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <label for="flat"
                                                                                           class="col-md-2 control-label">{Conf.tr("Flat fee")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="number" min="0"
                                                                                            placeholder="0.00"
                                                                                            name="flat"
                                                                                            value={ctrl.commissions()['from'] && ctrl.commissions()['from'].flat ? ctrl.commissions()['from'].flat : 0}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <label for="percent"
                                                                                           class="col-md-2 control-label">{Conf.tr("Percent fee")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="number" min="0"
                                                                                            placeholder="0.00"
                                                                                            name="percent"
                                                                                            value={ctrl.commissions()['from'] && ctrl.commissions()['from'].percent ? ctrl.commissions()['from'].percent : 0}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group m-b-0">
                                                                                    <div
                                                                                        class="col-sm-offset-2 col-sm-8">
                                                                                        <button
                                                                                            type="submit"
                                                                                            class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                                            {Conf.tr("Save")}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </form>
                                                                            , Conf.tr('Edit fees'))
                                                                    }}
                                                            >{Conf.tr('Manage')}</button>
                                                        </td>
                                                        <td>
                                                            {
                                                                ctrl.commissions()['from'] && ctrl.commissions()['from'].flat ||
                                                                ctrl.commissions()['from'] && ctrl.commissions()['from'].percent
                                                                    ?
                                                                    <button type="button"
                                                                            class="btn btn-danger btn-custom waves-effect w-md waves-light"
                                                                            onclick={ctrl.deleteTypesCommission.bind(ctrl, ctrl.selected_type(), null)}>
                                                                        {Conf.tr("Delete")}
                                                                    </button>
                                                                    :
                                                                    '-'
                                                            }
                                                        </td>
                                                    </tr>
                                                    {/*for to type only*/}
                                                    <tr>
                                                        <td>
                                                            {ctrl.selected_asset()}
                                                        </td>
                                                        <td>
                                                            -
                                                        </td>
                                                        <td>
                                                            {Conf.tr(ctrl.selected_type_text())}
                                                        </td>
                                                        <td>
                                                            {ctrl.commissions()['to'] && ctrl.commissions()['to'].flat ? ctrl.commissions()['to'].flat : '-'}
                                                        </td>
                                                        <td>
                                                            {ctrl.commissions()['to'] && ctrl.commissions()['to'].percent ? ctrl.commissions()['to'].percent : '-'}
                                                        </td>
                                                        <td>
                                                            <button class="btn btn-primary waves-effect waves-light"
                                                                    onclick={function () {
                                                                        Session.modal(
                                                                            <form class="form-horizontal"
                                                                                  id="commission_form" role="form"
                                                                                  method="post"
                                                                                  onsubmit={ctrl.saveTypesCommissions.bind(ctrl)}>
                                                                                <div class="form-group">
                                                                                    <label for="from"
                                                                                           class="col-md-2 control-label">{Conf.tr("To account type")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="text"
                                                                                            required="required"
                                                                                            readonly="readonly"
                                                                                            value={Conf.tr(ctrl.selected_type_text())}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="hidden" name="to"
                                                                                            id="to"
                                                                                            required="required"
                                                                                            readonly="readonly"
                                                                                            value={ctrl.selected_type()}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <label for="flat"
                                                                                           class="col-md-2 control-label">{Conf.tr("Flat fee")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="number" min="0"
                                                                                            placeholder="0.00"
                                                                                            name="flat"
                                                                                            value={ctrl.commissions()['to'] && ctrl.commissions()['to'].flat ? ctrl.commissions()['to'].flat : 0}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group">
                                                                                    <label for="percent"
                                                                                           class="col-md-2 control-label">{Conf.tr("Percent fee")}</label>
                                                                                    <div class="col-md-8">
                                                                                        <input
                                                                                            class="form-control"
                                                                                            type="number" min="0"
                                                                                            placeholder="0.00"
                                                                                            name="percent"
                                                                                            value={ctrl.commissions()['to'] && ctrl.commissions()['to'].percent ? ctrl.commissions()['to'].percent : 0}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div class="form-group m-b-0">
                                                                                    <div
                                                                                        class="col-sm-offset-2 col-sm-8">
                                                                                        <button
                                                                                            type="submit"
                                                                                            class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                                                            {Conf.tr("Save")}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </form>
                                                                            , Conf.tr('Edit fees'))
                                                                    }}
                                                            >{Conf.tr('Manage')}</button>
                                                        </td>
                                                        <td>
                                                            {
                                                                ctrl.commissions()['to'] && ctrl.commissions()['to'].flat ||
                                                                ctrl.commissions()['to'] && ctrl.commissions()['to'].percent
                                                                    ?
                                                                    <button type="button"
                                                                            class="btn btn-danger btn-custom waves-effect w-md waves-light"
                                                                            onclick={ctrl.deleteTypesCommission.bind(ctrl, null, ctrl.selected_type())}>
                                                                        {Conf.tr("Delete")}
                                                                    </button>
                                                                    :
                                                                    '-'
                                                            }
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            :
                                            ''
                                    }
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
                                            {Conf.tr('Please')}<a href='/currencies/create'
                                                                  config={m.route}> {Conf.tr("create")}</a>!
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