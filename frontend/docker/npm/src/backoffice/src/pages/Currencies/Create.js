var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth    = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.createAsset = function (e) {
            e.preventDefault();

            var asset_code = e.target.code.value;

            if (typeof asset_code != 'string' || !asset_code.length) {
                return m.flashError(Conf.tr("Invalid asset code"));
            }

            if (asset_code.length > 12) {
                return m.flashError(Conf.tr("Asset code must be 12 symbols maximum"));
            }

            var isAnonymous = e.target.anonymous.checked;

            m.onLoadingStart();

            Conf.horizon.loadAccount(Conf.master_key)
                .then(function (source) {
                    var asset = new StellarSdk.Asset(asset_code, Conf.master_key);
                    var isDelete = false;
                    var op = StellarSdk.Operation.manageAssets(asset, isAnonymous, isDelete);
                    var tx = new StellarSdk.TransactionBuilder(source).addOperation(op).build();
                    tx.sign(Auth.keypair());
                    return Conf.horizon.submitTransaction(tx);
                })
                .then(() => {
                    m.onLoadingEnd();
                    m.flashSuccess(Conf.tr("Asset created successfully"))
                })
                .catch((err) => {
                    console.log(err);
                    m.flashError(Conf.tr("Error creating asset") + " | " + err);
                });

        }
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="panel panel-primary panel-border">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Create new asset")}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="col-lg-6">
                                    <form class="form-horizontal" onsubmit={ctrl.createAsset.bind(ctrl)}>
                                        <div class="form-group">
                                            <label for="code" class="col-md-1 control-label">{Conf.tr("Code")}</label>
                                            <div class="col-md-4">
                                                <input class="form-control" name="code" id="code"
                                                       placeholder={Conf.tr("Currency Code")}
                                                       type="text" value="" required="required"/>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <div class="checkbox checkbox-primary col-md-offset-1">
                                                <input name="anonymous" id="anonymous" type="checkbox" checked="checked"/>
                                                    <label for="anonymous">
                                                        {Conf.tr('Allow anonymous accounts')}
                                                    </label>
                                            </div>
                                        </div>
                                        <div class="form-group m-b-0">
                                            <div class="col-sm-offset-1 col-sm-10">
                                                <button type="submit" class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr('Create')}</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};