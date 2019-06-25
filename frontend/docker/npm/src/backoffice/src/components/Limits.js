var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth');

var Session = require('../models/Session.js');

module.exports = {
    controller: function (account_id) {
        var ctrl = this;

        this.assets = m.prop([]);
        this.limits = m.prop([]);

        this.getData = function (account_id) {

            m.onLoadingStart();

            return Conf.horizon.accounts()
                .limits(account_id)
                .call()
                .then(limits => {
                    m.startComputation();
                    ctrl.limits(limits.limits);
                    m.endComputation();
                })
                .then(function(){
                    return Conf.horizon.assets()
                        .call();
                })
                .then(assets => {
                    m.startComputation();

                    // find agent's limits for an asset
                    assets.records.forEach(function (asset) {

                        asset['limits'] = {
                            max_operation_out: "-1",
                            daily_max_out    : "-1",
                            monthly_max_out  : "-1",
                            max_operation_in : "-1",
                            daily_max_in     : "-1",
                            monthly_max_in   : "-1",
                        };

                        var found_limits = _.find(ctrl.limits(), function(limit) { return limit.asset_code === asset.asset_code });

                        if (found_limits) {
                            delete found_limits.asset_code;
                            for (let key in found_limits) {
                                if (found_limits.hasOwnProperty(key)) {
                                    found_limits[key] = parseFloat(found_limits[key]);
                                }
                            }

                            asset['limits'] = found_limits;
                        }
                    });

                    ctrl.assets(assets.records);
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

        this.handleCheckBox = function (e) {
            var $closestInput = $(e.target).closest('td').find(':input[type="number"]');            

            if ($(e.target).is(":checked")) {
                $closestInput.fadeOut('fast');
                ctrl.assets()[$closestInput[0].name].limits[$closestInput[0].className] = "-1";
            } else {
                $closestInput.fadeIn('fast');
                ctrl.assets()[$closestInput[0].name].limits[$closestInput[0].className] = 0.01;
            }
        };

        this.handleLimitChange = function (e) {
            ctrl.assets()[e.target.name].limits[e.target.className] = e.target.value.toString();
        };

        this.saveLimits = function (e) {
            e.preventDefault();
            Session.closeModal();
            var adminKeyPair = null;

            m.onLoadingStart();

            m.getPromptValue(Conf.tr("Enter password to save limits"))
                .then(function (pwd) {
                    return Conf.SmartApi.Wallets.get({
                        username: Auth.username(),
                        password: pwd
                    })
                })
                .then(wallet => {
                    adminKeyPair = StellarSdk.Keypair.fromSeed(wallet.getKeychainData());
                    return Conf.horizon.loadAccount(Conf.master_key);
                })
                .then(source => {
                    ctrl.assets().forEach(function (asset) {

                        if (typeof asset.limits.asset_code != 'undefined') {
                            delete asset.limits.asset_code;
                        }

                        for (let key in asset.limits) {
                            if (asset.limits.hasOwnProperty(key)) {
                                if (asset.limits[key] > 0) {
                                    asset.limits[key] = asset.limits[key].toString();
                                } else {
                                    asset.limits[key] = "-1";
                                }
                            }
                        }

                        var op = StellarSdk.Operation.setAgentLimits(account_id, asset.asset_code, asset.limits);
                        var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
                        tx.sign(adminKeyPair);
                        return Conf.horizon.submitTransaction(tx);
                    });

                })
                .then(() => {
                    m.onLoadingEnd();
                    m.flashSuccess(Conf.tr("Limits saved successfully"))
                })
                .catch((error) => {
                    console.log(error);
                    if (error && typeof error.name != 'undefined' && error.name === 'ApiError') {
                        return m.flashError(Conf.tr('Wrong password'));
                    }
                    return m.flashError(Conf.tr("Error saving limits"));
                });
        };

        this.getData(account_id);
    },

    view: function (ctrl, account_id) {
        return <div class="panel panel-primary panel-border">
            <div class="panel-heading">
                <h3 class="panel-title">{Conf.tr("Limits for agent")} <span id="accountID">{account_id}</span></h3>
            </div>
            <div class="panel-body">
                <table class="table table-striped m-b-20">
                    <thead>
                    <tr>
                        <th>{Conf.tr("Currency")}</th>
                        <th>{Conf.tr("Max operation out")}</th>
                        <th>{Conf.tr("Daily max out")}</th>
                        <th>{Conf.tr("Monthly max out")}</th>
                        <th>{Conf.tr("Max operation in")}</th>
                        <th>{Conf.tr("Daily max in")}</th>
                        <th>{Conf.tr("Monthly max in")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ctrl.assets().map(function (asset, i) {
                        return <tr class="asset_code">
                        <td class="asset_name">{asset.asset_code}</td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                        style={asset.limits.max_operation_out < 0 ? "display: none" : ''}
                                       value={asset.limits.max_operation_out}
                                        class="max_operation_out" name={i}
                                        oninput={ctrl.handleLimitChange.bind(ctrl)}
                                        onchange={ctrl.handleLimitChange.bind(ctrl)}/>
                                    <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.max_operation_out < 0
                                    })}
                                    <label for="max_operation_out_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                    </p>
                                </td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                       style={asset.limits.daily_max_out < 0 ? "display: none" : ''}
                                       value={asset.limits.daily_max_out}
                                       class="daily_max_out" name={i}
                                       oninput={ctrl.handleLimitChange.bind(ctrl)}/>
                                <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.daily_max_out < 0
                                    })}
                                    <label for="daily_max_out_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                </p>
                            </td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                       style={asset.limits.monthly_max_out < 0 ? "display: none" : ''}
                                       value={asset.limits.monthly_max_out}
                                       class="monthly_max_out" name={i}
                                       oninput={ctrl.handleLimitChange.bind(ctrl)}/>
                                <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.monthly_max_out < 0
                                    })}
                                    <label for="monthly_max_out_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                </p>
                            </td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                       style={asset.limits.max_operation_in < 0 ? "display: none" : ''}
                                       value={asset.limits.max_operation_in}
                                       class="max_operation_in" name={i}
                                       oninput={ctrl.handleLimitChange.bind(ctrl)}/>
                                <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.max_operation_in < 0
                                    })}
                                    <label for="max_operation_in_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                </p>
                            </td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                       style={asset.limits.daily_max_in < 0 ? "display: none" : ''}
                                       value={asset.limits.daily_max_in}
                                       class="daily_max_in" name={i}
                                       oninput={ctrl.handleLimitChange.bind(ctrl)}/>
                                <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.daily_max_in < 0
                                    })}
                                    <label for="daily_max_in_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                </p>
                            </td>
                            <td>
                                <input type="number" min="0.01" step="0.01"
                                       style={asset.limits.monthly_max_in < 0 ? "display: none" : ''}
                                       value={asset.limits.monthly_max_in}
                                       class="monthly_max_in" name={i}
                                       oninput={ctrl.handleLimitChange.bind(ctrl)}/>
                                <p>
                                <div class="checkbox checkbox-primary">
                                    {m("input", {
                                        type: "checkbox",
                                        onclick: ctrl.handleCheckBox.bind(ctrl),
                                        checked: asset.limits.monthly_max_in < 0
                                    })}
                                    <label for="monthly_max_in_no_limit">
                                        {Conf.tr("No limit")}
                                    </label>
                                </div>
                                </p>
                            </td>
                        </tr>
                    })}

                    </tbody>
                </table>
                <button id="saveLimitsForAccount" type="submit" onclick={ctrl.saveLimits.bind(ctrl)}
                        class="btn btn-primary btn-custom waves-effect w-md waves-light m-r-5">{Conf.tr("Save")}</button>
            </div>
        </div>
    }
}