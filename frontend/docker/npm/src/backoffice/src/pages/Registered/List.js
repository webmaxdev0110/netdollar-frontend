var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth    = require('../../models/Auth'),
    Helpers = require('../../components/Helpers'),
    Pagination  = require('../../components/Pagination.js'),
    Session = require('../../models/Session.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.is_initialized = m.prop(false);

        this.page = (m.route.param('page')) ? m.prop(Number(m.route.param('page'))) : m.prop(1);
        this.limit = Conf.pagination.limit;
        this.offset = (ctrl.page() - 1) * ctrl.limit;
        this.pagination_data = m.prop({module: "Regusers", func: "getList", page: ctrl.page()});

        this.reg_users = m.prop([]);

        this.balances = m.prop([]);

        this.getRegisteredUsers = function () {
            m.onLoadingStart();
            Conf.SmartApi.Regusers.getList({limit: ctrl.limit, offset: ctrl.offset})
                .then(function(reg_users){
                    if (typeof reg_users.data != 'undefined') {
                        m.startComputation();
                        ctrl.reg_users(reg_users.data);
                        ctrl.is_initialized(true);
                        m.endComputation();
                    } else {
                        console.error('Unexpected response');
                        console.error(reg_users);
                    }
                })
                .catch(function(error) {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr('Can not get registered users list'));
                })
                .then(function() {
                    m.onLoadingEnd();
                });
        };

        // this.destroyAccount = function (reg_user, e) {
        //
        //     if (!reg_user || !reg_user.account_id) {
        //         return m.flashError(Conf.tr("Invalid registered user data"));
        //     }
        //
        //     if (!StellarSdk.Keypair.isValidPublicKey(reg_user.account_id)) {
        //         return m.flashError(Conf.tr("Account is invalid"));
        //     }
        //
        //     swal({
        //         title: Conf.tr("Destroy registered user account") + '?',
        //         type: "warning",
        //         showCancelButton: true,
        //         confirmButtonColor: "#DD6B55",
        //         confirmButtonText: Conf.tr("Yes, delete it"),
        //         cancelButtonText: Conf.tr("Cancel")
        //     })
        //         .then(function() {
        //             m.onLoadingStart();
        //             return Conf.horizon.loadAccount(Conf.master_key)
        //                 .then(function (source) {
        //                     var tx = new StellarSdk.TransactionBuilder(source)
        //                         .addOperation(StellarSdk.Operation.accountMerge({
        //                             source: reg_user.account_id,
        //                             destination: Conf.master_key
        //                             }))
        //                         .build();
        //
        //                     tx.sign(Auth.keypair());
        //
        //                     return Conf.horizon.submitTransaction(tx);
        //                 })
        //                 .then(function(){
        //                     return swal(Conf.tr("Destroyed") + "!",
        //                         Conf.tr("Registered user destroyed"),
        //                         "success"
        //                     );
        //                 })
        //                 .catch(function (err) {
        //                     console.log(err);
        //                     m.flashError(Conf.tr("Cannot destroy account"));
        //                 })
        //         });
        // };

        this.showUserData = function (reg_user, e) {

            m.onLoadingStart();

            if (!reg_user) {
                return m.flashError(Conf.tr("Invalid registered user data"));
            }

            m.startComputation();
            ctrl.balances([]);
            m.endComputation();

            if (reg_user.account_id) {
                if (!StellarSdk.Keypair.isValidPublicKey(reg_user.account_id)) {
                    return m.flashError(Conf.tr("Account is invalid"));
                }
                Auth.loadAccountById(reg_user.account_id)
                    .then(function (account_data) {
                        m.startComputation();
                        account_data.balances.map(function(balance) {
                            if (typeof balance.asset_code != 'undefined') {
                                ctrl.balances().push(balance);
                            }
                        });
                        m.endComputation();
                    })
                    .then(() => {
                        m.onLoadingEnd();
                        return ctrl.showData(reg_user);
                    })
                    .catch((error) => {
                        console.error(error);
                        return m.flashError(Conf.tr("Can not get registered user account data"));
                    })
            } else {
                m.onLoadingEnd();
                return ctrl.showData(reg_user);
            }
        };

        this.showData = function(reg_user) {
            m.startComputation();
            Session.modal(
                <div>
                    {
                        ctrl.balances().length ?
                            <div class="alert alert-success">
                                {
                                    ctrl.balances().map(function (balance) {
                                        return <p>{balance.asset_code}: {parseFloat(balance.balance).toFixed(2)}</p>
                                    })
                                }
                            </div>
                            :
                            <div class="alert alert-warning">{Conf.tr('No balances')}</div>
                    }
                    <table class="table">
                        <tr>
                            <td>{Conf.tr('Account ID')}:</td>
                            <td><code>{reg_user.account_id || Conf.tr("Account ID is not approved yet")}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('User ID')}:</td>
                            <td><code>{reg_user.id}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('Passport')}:</td>
                            <td><code>{reg_user.passport}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('IPN')}:</td>
                            <td><code>{reg_user.ipn_code}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('Address')}:</td>
                            <td><code>{reg_user.address}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('Phone')}:</td>
                            <td><code>{reg_user.phone}</code></td>
                        </tr>
                        <tr>
                            <td>{Conf.tr('E-mail')}:</td>
                            <td><code>{reg_user.email}</code></td>
                        </tr>
                    </table>
                </div>
                , Conf.tr('About user'));
            m.endComputation();
        };

        this.getRegisteredUsers();
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {(ctrl.is_initialized()) ?
                            <div>
                                {(ctrl.reg_users().length) ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Registered users')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <table class="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr("ID")}</th>
                                                    <th>{Conf.tr("Created")}</th>
                                                    <th>{Conf.tr("Name")}</th>
                                                    <th>{Conf.tr('Information')}</th>
                                                    <th>{Conf.tr('Currency')}</th>
                                                    {/*<th>{Conf.tr('Destroy')}</th>*/}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {ctrl.reg_users().map(function (reg_user) {
                                                    return <tr>
                                                        <td>
                                                            {reg_user.id}
                                                        </td>
                                                        <td>
                                                            <span>{Helpers.getDateFromTimestamp(reg_user.created)}</span>
                                                        </td>
                                                        <td>
                                                            {reg_user.surname + ' ' + reg_user.name + ' ' + reg_user.middle_name}
                                                        </td>
                                                        <td>
                                                            <button
                                                                class="btn-xs btn-warning waves-effect waves-light"
                                                                onclick={ctrl.showUserData.bind(ctrl, reg_user)}
                                                            >
                                                                {Conf.tr('Show data')}
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Asset")}>{reg_user.asset}</span>
                                                        </td>
                                                        {/*<td>*/}
                                                            {/*<button*/}
                                                                {/*class="btn-xs btn-danger waves-effect waves-light"*/}
                                                                {/*onclick={ctrl.destroyAccount.bind(ctrl, reg_user)}*/}
                                                                {/*>*/}
                                                                {/*{Conf.tr('Destroy account')}*/}
                                                            {/*</button>*/}
                                                        {/*</td>*/}
                                                    </tr>
                                                })}
                                                </tbody>
                                            </table>
                                            {m.component(Pagination, {pagination: ctrl.pagination_data()})}
                                        </div>
                                    </div>
                                    :
                                    <div class="portlet">
                                        <div class="portlet-heading bg-warning">
                                            <h3 class="portlet-title">
                                                {Conf.tr('No registered users found')}
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
                                                {Conf.tr('Please')}<a href='/registered/create' config={m.route}> {Conf.tr("create")}</a>!
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                            :
                            <div class="portlet">
                                <div class="portlet-heading bg-primary">
                                    <h3 class="portlet-title">
                                        {Conf.tr('Wait for data loading')}...
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