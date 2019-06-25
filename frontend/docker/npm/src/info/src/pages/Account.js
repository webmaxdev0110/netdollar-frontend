var Conf = require('../config/Config.js'),
    Navbar = require('../components/Navbar.js'),
    Helpers = require('../components/Helpers.js'),
    Session = require('../models/Session.js'),
    Footer = require('../components/Footer.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.account_id       = m.route.param('account_id');
        this.is_agent         = m.prop(false);
        this.account_type     = m.prop(false);
        this.payments_data    = m.prop([]);
        this.payments_amount  = m.prop([]);
        this.total_sum_plus   = m.prop(0);
        this.total_sum_minus  = m.prop(0);
        this.account_data     = m.prop(null);
        this.account_balances = m.prop([]);



        this.updatePaymentsStatistic = function () {
            m.onLoadingStart();
            return new Promise(function(resolve){
                var total_plus = 0;
                var total_minus = 0;

                ctrl.payments_data().map(function (payment) {
                    if (payment.to == ctrl.account_id) {
                        total_plus += payment.amount * 1;
                    } else {
                        total_minus += payment.amount * 1;
                    }
                });

                m.startComputation();
                ctrl.total_sum_plus(total_plus);
                ctrl.total_sum_minus(total_minus);
                m.endComputation();
                m.onLoadingEnd();
                resolve();
            })
        };

        this.getAccountInfo = function () {
            m.onLoadingStart();
            Conf.horizon.accounts()
                .accountId(ctrl.account_id)
                .call()
                .then(function (account_data) {
                    m.startComputation();
                    ctrl.account_data(account_data);
                    account_data.balances.map(function (b) {
                        if (b.asset_type != 'native') {
                            ctrl.account_balances().push(b);
                        }
                    })
                    switch(account_data.type_i) {
                        case 3:
                        case 4:
                        case 5:
                            ctrl.is_agent(true);
                    }
                    ctrl.account_type(Helpers.getTextAccountType(account_data.type_i));
                    m.endComputation();
                })
                .catch(function (err) {
                    console.error(err);
                    m.flashError(Conf.tr('Can not get account info'))
                })
                .then(function () {
                    m.onLoadingEnd();
                })
        };

        this.getPayments = function () {
            m.onLoadingStart();
            return new Promise(function(resolve, reject) {
                Conf.horizon.payments()
                    .forAccount(ctrl.account_id)
                    .limit(Conf.limit)
                    .order('desc')
                    .call()
                    .then(function (result) {
                        if (!_.isEmpty(result.records)) {
                            _.each(result.records.reverse(), function (res) {
                                m.startComputation();

                                ctrl.payments_data().unshift(res);
                                ctrl.payments_amount().unshift(res.amount);
                                while (ctrl.payments_data().length > Conf.limit) {
                                    ctrl.payments_data().pop();
                                    ctrl.payments_amount().pop();
                                }

                                m.endComputation();
                            });
                            Helpers.buildPaymentsChart(ctrl.payments_amount());
                        };
                    })
                    .then(function () {
                        Conf.horizon.payments()
                            .cursor('now')
                            .stream({
                                onmessage: function (message) {
                                    var res = message.data ? JSON.parse(message.data) : message;

                                    m.startComputation();
                                    ctrl.payments_data().unshift(res);
                                    ctrl.payments_amount().unshift(res.amount);
                                    while (ctrl.payments_data().length > Conf.limit) {
                                        ctrl.payments_data().pop();
                                        ctrl.payments_amount().pop();
                                    }

                                    m.endComputation();

                                    Helpers.buildPaymentsChart(ctrl.payments_amount());
                                    ctrl.updatePaymentsStatistic();
                                },
                                onerror: function (error) {
                                }
                            });
                    })
                    .then(function () {
                        m.onLoadingEnd();
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        console.error(err);
                        reject(err);
                    })
            });
        };

        this.getPayments()
            .then(ctrl.updatePaymentsStatistic)
            .then(ctrl.getAccountInfo);

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            <div class="content-page">
                <div class="wrapper">
                    <div class="container">
                        <div class="row">

                            <div class="row">
                                <div class="col-sm-12 col-lg-4">
                                    <div class="widget-simple text-center card-box">
                                        <h3 class="text-primary"><span class="counter" id="total_sum_plus">{ctrl.total_sum_plus()}</span> $</h3>
                                        <p class="text-muted long-p">{Conf.tr('Last received funds amount')}</p>
                                    </div>
                                </div>
                                <div class="col-sm-12 col-lg-4">
                                    <div class="widget-simple text-center card-box">
                                        <h3 class="text-danger"><span class="counter" id="total_sum_minus">{ctrl.total_sum_minus()}</span> $</h3>
                                        <p class="text-muted long-p">{Conf.tr('Last spent funds amount')}</p>
                                    </div>
                                </div>
                                <div class="col-sm-12 col-lg-4">
                                    <div class="widget-simple text-center card-box">
                                        <h3 class="text-danger">{
                                            ctrl.account_balances() && ctrl.account_balances().length ?
                                                ctrl.account_balances().length > 1 ?
                                                    <button
                                                        class="btn-xs btn-warning waves-effect waves-light m-t-10"
                                                        onclick={function(){
                                                            Session.modal(
                                                                <table class="table table-bordered">
                                                                    <tbody>
                                                                    {
                                                                        ctrl.account_balances().map(b => {
                                                                            return <tr>
                                                                                    <td>
                                                                                        {parseFloat(b.balance).toFixed(2)}
                                                                                    </td>
                                                                                    <td>{b.asset_code}</td>
                                                                                </tr>
                                                                        })
                                                                    }
                                                                    </tbody>
                                                                </table>
                                                                , Conf.tr("Account ID" + ': ' + ctrl.account_id ), 'medium')
                                                        }}
                                                    >{Conf.tr("Show balances")}</button>
                                                    :
                                                    ctrl.account_balances().map(b => {
                                                        return <span class="label label-primary">
                                                                {parseFloat(b.balance).toFixed(2) + " " + b.asset_code}
                                                            </span>
                                                    })
                                                :
                                                '0.00'
                                        }
                                        </h3>
                                        <p class="text-muted">{Conf.tr('Current balances')}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="panel panel-default panel-color">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Account information')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            {
                                                ctrl.account_data() ?
                                                    <div>
                                                        {
                                                            ctrl.is_agent() ?
                                                            <div class="alert alert-danger">
                                                                <strong>{Conf.tr('Attention')}!</strong> {Conf.tr('Information about agents will be hidden')}
                                                            </div>
                                                            :
                                                            ''
                                                        }
                                                        <p>{Conf.tr('Account ID')}: {ctrl.account_id}</p>
                                                        <p>{Conf.tr('Account type')}: {ctrl.account_type()}</p>
                                                    </div>

                                                    :
                                                    Conf.tr('Loading') + '...'
                                            }

                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-lg-12 hidden-xs">
                                    <div class="card-box">
                                        <h4 class="m-t-0 header-title">
                                            <b>
                                                {Conf.tr('Last transactions')}
                                            </b>
                                        </h4>
                                        <div id="smil-left-animations" class="ct-chart ct-golden-section"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="card-box hidden-xs">
                                <h4 class="m-t-0 header-title">
                                    {Conf.tr('Payments')}
                                </h4>
                                <table class="table table-striped m-0">
                                    <thead>
                                        <tr>
                                            <th>
                                                {Conf.tr('Transaction ID')}
                                            </th>
                                            <th>
                                                {Conf.tr('Payments from')}
                                            </th>
                                            <th>
                                                {Conf.tr('Payments to')}
                                            </th>
                                            <th>
                                                {Conf.tr('Amount')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        ctrl.payments_data().map(function(payment){
                                            return <tr>
                                                <td><a href={"/transaction/" + payment._links.transaction.href.split(/[\/ ]+/).pop()} config={m.route}>{payment.id}</a></td>
                                                <td><a href={"/account/" + payment.from} config={m.route}>{_.trunc(payment.from, {length: 15})}</a></td>
                                                <td><a href={"/account/" + payment.to} config={m.route}>{_.trunc(payment.to, {length: 15})}</a></td>
                                                <td>
                                                    <div class="label label-success">
                                                        {
                                                            payment.fee.type_i > 0 ?
                                                                parseFloat(payment.amount-payment.fee.amount_changed).toFixed(2) + ' + ' + parseFloat(payment.fee.amount_changed).toFixed(2)
                                                                    :
                                                                parseFloat(payment.amount).toFixed(2)

                                                        }
                                                        {payment.asset_code}
                                                    </div>
                                                </td>
                                            </tr>
                                        })
                                    }
                                    </tbody>
                                </table>
                            </div>

                            <div class="payments visible-xs">
                                {
                                    ctrl.payments_data().map(function(payment) {
                                        return <div class="payment">
                                            <p><span>{Conf.tr('Payment from')}: </span><a href={"/account/" + payment.from} config={m.route}>{_.trunc(payment.from, {length: 15})}</a></p>
                                            <p><span>{Conf.tr('Payment to')}: </span><a href={"/account/" + payment.to} config={m.route}>{_.trunc(payment.to, {length: 15})}</a></p>
                                            <hr/>
                                                <div class="row">
                                                    <div class="col-xs-7">
                                                        <span>{Conf.tr('Transaction id')}: </span><a href={"/transaction/" + payment._links.transaction.href.split(/[\/ ]+/).pop()} config={m.route}>{payment.id}</a>
                                                    </div>
                                                    <div class="col-xs-5 text-right">
                                                        <span class="label label-success">
                                                            <i class="fa fa-sign-in fa-fw" aria-hidden="true"></i>
                                                            &nbsp;
                                                            { payment.fee.type_i > 0 ?
                                                            parseFloat(payment.amount-payment.fee.amount_changed).toFixed(2) + ' + ' + parseFloat(payment.fee.amount_changed).toFixed(2)
                                                                :
                                                                parseFloat(payment.amount).toFixed(2)
                                                            }
                                                            {payment.asset_code}
                                                        </span>
                                                    </div>
                                                    <div class="clearfix"></div>
                                                </div>
                                        </div>
                                    })
                                }
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};