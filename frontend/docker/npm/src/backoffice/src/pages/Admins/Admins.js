var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Operations   = require('../../components/Operations'),
    Auth      = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.admins = [];
        this.admins_data = m.prop([]);

        this.getAdmins = function () {
            m.onLoadingStart();
            Operations.getAdminsList()
                .then(function(admins) {
                    ctrl.admins = admins;
                    return Conf.SmartApi.Admins.getList({
                        account_ids: admins
                    })
                })
                .then(function(response){
                    var formatted_data = [];
                    ctrl.admins.map(function(account_id){
                        formatted_data.push({account_id: account_id})
                    });
                    response.data.map(function(account_data){
                        formatted_data.map(function(admin_data){
                            if ("account_id" in admin_data && account_data.account_id == admin_data.account_id) {
                                admin_data.data = account_data;
                            }
                        })
                    });
                    m.startComputation();
                    ctrl.admins_data(formatted_data);
                    m.endComputation();
                })
                .catch(function(error){
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr('Can not get admins list'));
                }).then(function(){
                    m.onLoadingEnd();
                });
        };

        this.deleteAdminKey = function(account_id, e) {
            Operations.deleteMasterSigner(account_id)
                .then(function(){
                    m.route(m.route())
                })
                .then(function(){
                    return swal(Conf.tr("Deleted") + "!",
                        Conf.tr("Administrator key successfully deleted"),
                        "success"
                    );
                })
                .catch(function (e) {
                    m.flashError(Conf.tr("Cannot delete signer"));
                    console.log(e);
                });
        };

        this.getAdmins();
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
                                <h3 class="panel-title">{Conf.tr('Admins')}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="alert alert-info">
                                    {Conf.tr('This page allows to manage accounts of administrators. They are able to approve emission accounts, agents, change limits and permissions, ban accounts, view statistics.')}
                                </div>
                                <table class="table table-bordered">
                                    <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{Conf.tr('Account ID')}</th>
                                        <th>{Conf.tr('Name')}</th>
                                        <th>{Conf.tr('Position')}</th>
                                        <th>{Conf.tr('Comment')}</th>
                                        <th>{Conf.tr('Actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {ctrl.admins_data().map(function(account_data, index) {
                                        var additional_data = account_data.data || {};
                                        return <tr>
                                            <th scope="row">{index + 1}</th>
                                            <td>
                                                <span title={account_data.account_id}>{account_data.account_id}</span>
                                            </td>
                                            <td>
                                                <span>{additional_data.name || Conf.tr('No data yet')}</span>
                                            </td>
                                            <td>
                                                <span>{additional_data.position || Conf.tr('No data yet')}</span>
                                            </td>
                                            <td>
                                                <span>{additional_data.comment || Conf.tr('No data yet')}</span>
                                            </td>
                                            <td>
                                                { account_data.account_id != Auth.keypair().accountId() ?
                                                    <button type="submit"
                                                            onclick={ctrl.deleteAdminKey.bind(ctrl, account_data.account_id)}
                                                            class="btn btn-danger btn-xs waves-effect waves-light">{Conf.tr('Delete')}</button>
                                                    :
                                                    Conf.tr('Your account')
                                                }
                                            </td>
                                        </tr>
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};