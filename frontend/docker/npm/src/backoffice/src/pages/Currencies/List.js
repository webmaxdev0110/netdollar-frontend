var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth    = require('../../models/Auth');

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

        this.deleteAsset = function (asset_code) {

            swal({
                title: Conf.tr("Delete currency") + '?',
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: Conf.tr("Yes, delete it"),
                cancelButtonText: Conf.tr("Cancel")
            })
                .then(function() {
                m.onLoadingStart();
                return Conf.horizon.loadAccount(Conf.master_key)
                    .then(function (source) {

                        var asset = new StellarSdk.Asset(asset_code, Conf.master_key);
                        var isAnonymous = true;
                        var isDelete = true;

                        var tx = new StellarSdk.TransactionBuilder(source)
                            .addOperation(StellarSdk.Operation.manageAssets(asset, isAnonymous, isDelete))
                            .build();

                        tx.sign(Auth.keypair());

                        return Conf.horizon.submitTransaction(tx);
                    })
                    .then(function(){
                        return ctrl.getAssets();
                    })
                    .then(function(){
                        m.onLoadingEnd();
                    })
                    .then(function(){
                        return swal(Conf.tr("Deleted") + "!",
                            Conf.tr("Currency successfully deleted"),
                            "success"
                        );
                    })
                    .catch(function(err){
                        console.log(err);
                        return m.flashError(Conf.tr(err));
                    });
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
                        {ctrl.assets ?
                            <div class="panel panel-color panel-primary">
                                <div class="panel-heading">
                                    <h3 class="panel-title">{Conf.tr("Currencies")}</h3>
                                </div>
                                <div class="panel-body">
                                    <div class="alert alert-info">
                                        {Conf.tr('This page allows to create new currencies (digital assets) that bank manages')}
                                    </div>
                                    <table class="table table-bordered">
                                        <thead>
                                        <tr>
                                            <th>{Conf.tr("Code")}</th>
                                            <th>{Conf.tr("Issuer")}</th>
                                            <th>{Conf.tr("Allow anonymous accounts")}</th>
                                            <th>{Conf.tr("Delete")}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {ctrl.assets().map(function (asset) {
                                            return <tr>
                                                <td class="col-sm-1">{asset.asset_code}</td>
                                                <td class="col-sm-1">{asset.asset_issuer}</td>
                                                <td class="col-sm-1"><span class="label label-primary">{Conf.tr(asset.is_anonymous)}</span></td>
                                                <td class="col-sm-1">
                                                    <button
                                                       class="btn btn-danger btn-custom waves-effect w-md waves-light"
                                                       onclick={ctrl.deleteAsset.bind(ctrl, asset.asset_code)}
                                                    >{Conf.tr('Delete')}</button>
                                                </td>
                                            </tr>
                                        })}
                                        </tbody>
                                    </table>
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