var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Operations = require('../../components/Operations'),
    Auth = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.emissions = m.prop([]);

        this.getEmissionKeys = function () {
            m.onLoadingStart();
            Operations.getEmissionKeysList()
                .then(function (emm_keys) {
                    m.startComputation();
                    ctrl.emissions(emm_keys);
                    m.endComputation();
                }).catch(function (err) {
                console.error(err);
                m.flashError(Conf.tr('Can not get emission keys list'));
            }).then(function () {
                m.onLoadingEnd();
            });
        };

        this.deleteEmissionKey = function (account_id, e) {
            Operations.deleteMasterSigner(account_id)
                .then(function () {
                    m.route(m.route())
                })
                .then(function () {
                    return swal(Conf.tr("Deleted") + "!",
                        Conf.tr("Emission key successfully deleted"),
                        "success"
                    );
                })
                .catch(function (e) {
                    m.flashError(Conf.tr("Cannot delete signer"));
                    console.log(e);
                });
        };

        this.getEmissionKeys();
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {(ctrl.emissions) ?
                            <div class="panel panel-color panel-primary">
                                <div class="panel-heading">
                                    <h3 class="panel-title">{Conf.tr('Emission accounts')}</h3>
                                </div>
                                <div class="panel-body">
                                    <div class="alert alert-info">
                                        {Conf.tr('This page allows to manage accounts that are able to approve emission of e-money. These could be cashiers for example.')}
                                    </div>
                                    <table class="table table-bordered">
                                        <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{Conf.tr('Account')}</th>
                                            <th>{Conf.tr('Actions')}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {ctrl.emissions().map(function (em_key, index) {
                                            return <tr>
                                                <th scope="row">{index + 1}</th>
                                                <td>
                                                    <span title={em_key}>{em_key}</span>
                                                </td>
                                                <td>
                                                    <button type="submit"
                                                            onclick={ctrl.deleteEmissionKey.bind(ctrl, em_key)}
                                                            class="btn btn-danger btn-xs waves-effect waves-light">{Conf.tr('Delete')}</button>
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
                                        {Conf.tr('No emission accounts found')}
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
                                        {Conf.tr('Please')}<a href='/emission/generate'
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