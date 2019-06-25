var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');
var DateFormat = require('dateformat');

var Transaction = module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }
        Conf.SmartApi.Api.refreshNonce();

        this.navbar = new Navbar.controller();

        this.transaction = m.prop(false);
        this.account = m.prop(false);
        this.payment = m.prop(false);
        this.balances = m.prop([]);

        this.getAccount = function (aid) {
            Auth.loadAccountById(aid)
                .then((accountResult) => {
                    m.startComputation();
                    ctrl.account(accountResult);
                    m.endComputation();
                })
                .catch(function (err) {
                    console.error(err);
                    m.flashError(Conf.tr("Can't load account by transaction"));
                })
        }

        this.getTransaction = function (tid) {
            Auth.loadTransactionInfo(tid)
                .then((transactionResult) => {
                    m.startComputation();
                    ctrl.transaction(transactionResult);
                    m.endComputation();
                })
                .catch(function (err) {
                    console.log(err);
                    m.flashError(Conf.tr("Transaction loading error"));
                })
        }

        this.getTransaction(m.route.param("trans_id"));
        this.getAccount(m.route.param("target_acc"));
    },

    view: function (ctrl) {
        return [
            m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <div class="panel panel-border panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">{Conf.tr("Transaction")}</h3>
                        </div>

                        <div class="panel-body">
                            <table class="table table-bordered m-0 small-table">
                                <tbody>
                                <tr>
                                    <th>{Conf.tr("Created at")}:</th>
                                    <td>{DateFormat(ctrl.transaction().created_at, 'dd.mm.yyyy HH:MM:ss')}</td>
                                </tr>
                                <tr>
                                    <th>{Conf.tr("Transaction ID")}:</th>
                                    <td><span class="account_overflow">{ctrl.transaction().id}</span></td>
                                </tr>
                                <tr>
                                    <th>{Conf.tr("Transaction amount")}:</th>
                                    <td>{parseFloat(m.route.param("amount")).toFixed(2)}</td>
                                </tr>
                                {(ctrl.transaction().memo) ?
                                    <tr>
                                        <th>{Conf.tr("Transaction memo")}:</th>
                                        <td>{ctrl.transaction().memo}</td>
                                    </tr>
                                    :
                                    ''
                                }
                                <tr>
                                    <th>{Conf.tr("Target account ID")}:</th>
                                    <td><a href={Conf.info_host + '/account/' + ctrl.account().id}
                                           target="_blank"
                                    ><span class="account_overflow">{ctrl.account().id}</span>
                                    </a></td>
                                </tr>
                                <tr>
                                    <th>{Conf.tr("Target account type")}:</th>
                                    <td>{ctrl.account().type}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="panel-footer text-center">
                            <a href={'/transfer' + '?account='+ctrl.account().id +
                                                        '&amount='+parseFloat(m.route.param("amount")).toFixed(2) +
                                                        '&asset='+m.route.param("asset")}
                               config={m.route}
                               class="btn btn-primary btn-custom waves-effect w-md waves-light"
                            >
                                <span class="fa fa-repeat"></span>
                                &nbsp;{Conf.tr("Repeat")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            ,
            m.component(Footer)
        ]
    }
};
