var Conf = require('../config/Config.js'),
    Navbar = require('../components/Navbar.js'),
    Helpers = require('../components/Helpers.js'),
    Footer = require('../components/Footer.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.payments_data   = m.prop([]);
        this.payments_amount = m.prop([]);
        this.total_sum     = m.prop(0);
        this.last_tx_time  = m.prop(0);

        this.max_tx  = m.prop(0);
        this.avg_tx  = m.prop(0);
        this.min_tx  = m.prop(0);

        this.cnt_adm = m.prop(0);
        this.cnt_ems = m.prop(0);

        this.updatePaymentsStatistic = function () {

            m.onLoadingStart();
            return new Promise(function(resolve) {

                var total = 0;
                var min   = 0;
                var max   = 0;

                ctrl.payments_data().map(function(res, index) {
                    if (index == 0) {
                        min   = Helpers.round(res.amount, 2);
                        max   = Helpers.round(res.amount, 2);
                    }
                    total += Helpers.round(res.amount, 2);
                    if (res.amount < min) { min = Helpers.round(res.amount, 2);}
                    if (res.amount > max) { max = Helpers.round(res.amount, 2);}
                });

                m.startComputation();
                ctrl.total_sum(Helpers.round(total, 2));
                ctrl.max_tx(Helpers.round(max, 2));
                ctrl.min_tx(Helpers.round(min, 2));
                ctrl.avg_tx(Helpers.round(Math.floor(total / ctrl.payments_data().length), 2));
                m.endComputation();

                m.onLoadingEnd();
                resolve();
            })
        };

        this.updateSignersStatistic = function () {
            m.onLoadingStart();
            //get master signers
            return Conf.horizon.accounts()
                .accountId(Conf.master_public_key)
                .call()
                .then(function(source){

                    var signers = source.signers;
                    var cnt_adm = 0;
                    var cnt_ems = 0;

                    Object.keys(signers).forEach(function(key) {
                        var signer = signers[key];
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value && signer.signertype) {
                            cnt_adm++;
                        } else if (signer.weight == StellarSdk.xdr.SignerType.signerEmission().value && signer.signertype) {
                            cnt_ems++;
                        }
                    });

                    m.startComputation();
                    ctrl.cnt_adm(cnt_adm);
                    ctrl.cnt_ems(cnt_ems);
                    m.endComputation();

                })
                .then(function(){
                    m.onLoadingEnd();
                })
                .catch(function (err) {
                    console.error(err);
                });

        };

        this.getPayments = function () {
            m.onLoadingStart();

            return new Promise(function(resolve, reject){
                Conf.horizon.payments()
                    .limit(Conf.limit)
                    .order('desc')
                    .call()
                    .then(function (result) {
                        if (!_.isEmpty(result.records)) {
                            _.each(result.records.reverse(), function(res, key){
                                m.startComputation();
                                if (key+1 == result.records.length) {
                                    ctrl.last_tx_time(Helpers.getNormalizeDate(res.closed_at, true));
                                }

                                ctrl.payments_data().unshift(res);
                                ctrl.payments_amount().unshift(Helpers.round(res.amount, 2));
                                while (ctrl.payments_data().length > Conf.limit) {
                                    ctrl.payments_data().pop();
                                    ctrl.payments_amount().pop();
                                }
                                m.endComputation();
                            });
                            Helpers.buildPaymentsChart(ctrl.payments_amount());
                        };
                        resolve();
                    })
                    .then(function () {
                        return Conf.horizon.payments()
                            .cursor('now')
                            .stream({
                                onmessage: function(message) {
                                    var res = message.data ? JSON.parse(message.data) : message;

                                    m.startComputation();
                                    ctrl.payments_data().unshift(res);
                                    ctrl.payments_amount().unshift(Helpers.round(res.amount, 2));
                                    while (ctrl.payments_data().length > Conf.limit) {
                                        ctrl.payments_data().pop();
                                        ctrl.payments_amount().pop();
                                    }
                                    ctrl.last_tx_time(Helpers.getNormalizeDate(res.closed_at, true));
                                    m.endComputation();

                                    Helpers.buildPaymentsChart(ctrl.payments_amount());
                                    ctrl.updatePaymentsStatistic();
                                },
                                onerror: function(error) {
                                }
                            });
                    })
                    .then(function(){
                        m.onLoadingEnd();
                    })
                    .catch(function (err) {
                        console.error(err);
                        reject(err);
                    })
            });
        };

        this.getPayments()
            .then(ctrl.updateSignersStatistic)
            .then(ctrl.updatePaymentsStatistic);

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            <div class="content-page">
                <div class="wrapper">
                    <div class="container">
                        <div class="row">
                            <div class="col-xs-12 col-md-6 col-lg-4">
                                <div class="widget-simple text-center card-box">
                                    <div class="col-lg-6 be2in1">
                                        <h3 class="text-primary"><span class="counter" id="total_sum">{ctrl.total_sum()}</span> $</h3>
                                        <p class="text-muted long-p">
                                            {Conf.tr('Recent transactions sum')}
                                        </p>
                                    </div>
                                    <div class="col-lg-6 be2in1">
                                        <h3 class="text-primary"><span id="last_tx_time">{ctrl.last_tx_time()}</span></h3>
                                        <p class="text-muted long-p">
                                            {Conf.tr('Last transaction time')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xs-12 col-md-6 col-lg-4">
                                <div class="widget-simple text-center card-box padd_10">
                                    <div class="col-lg-4 be3in1">
                                        <h3 class="text-primary"><span class="counter" id="max_tx">{ctrl.max_tx()}</span> $</h3>
                                        <p class="text-muted">
                                            {Conf.tr('Max')}
                                        </p>
                                    </div>
                                    <div class="col-lg-4 be3in1">
                                        <h3 class="text-primary"><span class="counter" id="avg_tx">{ctrl.avg_tx()}</span> $</h3>
                                        <p class="text-muted">
                                            {Conf.tr('Average')}
                                        </p>
                                    </div>
                                    <div class="col-lg-4 be3in1">
                                        <h3 class="text-primary"><span class="counter" id="min_tx">{ctrl.min_tx()}</span> $</h3>
                                        <p class="text-muted">
                                            {Conf.tr('Min')}
                                        </p>
                                    </div>

                                </div>
                            </div>
                            <div class="col-xs-12 col-md-12 col-lg-4">
                                <div class="widget-simple text-center card-box">
                                    <div class="col-lg-6 be2in1">
                                        <h3 class="text-primary"><span class="counter" id="cnt_adm">{ctrl.cnt_adm()}</span></h3>
                                        <p class="text-muted">
                                            {Conf.tr('Admins')}
                                        </p>
                                    </div>
                                    <div class="col-lg-6 be2in1">
                                        <h3 class="text-primary"><span class="counter" id="cnt_ems">{ctrl.cnt_ems()}</span></h3>
                                        <p class="text-muted">
                                            {Conf.tr('Emissions')}
                                        </p>
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