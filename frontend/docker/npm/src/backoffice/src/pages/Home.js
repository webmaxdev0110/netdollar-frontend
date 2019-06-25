var Conf = require('../config/Config.js'),
    Navbar = require('../components/Navbar.js'),
    Footer = require('../components/Footer.js'),
    Sidebar = require('../components/Sidebar.js'),
    Payments = require('../components/Payments.js'),
    DateFormat  = require('dateformat'),
    Auth      = require('../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.loaded             = m.prop(false); //loading flag
        this.cnt_adm            = m.prop(0); //admins counter
        this.cnt_ems            = m.prop(0); //emission keys counter
        this.last_payments      = m.prop(false);
        this.last_payment_time  = m.prop(false);

        this.getData = function () {
            m.onLoadingStart();
            return ctrl.getSignersCounters()
                .then(function() {
                    return ctrl.getLastPayments();
                })
                .then(function() {
                    m.startComputation();
                    //view will be redraw
                    ctrl.loaded(true);
                    m.endComputation();
                    //make animations here
                    $('#cnt_adm').html(ctrl.cnt_adm());
                    $('#cnt_ems').html(ctrl.cnt_ems());

                    setTimeout(function(){
                        $('.counter').counterUp({
                            delay: 100,
                            time: 1200
                        });
                    }, 10);

                })
                .catch(function (err) {
                    console.error(err);
                    return m.flashError(Conf.tr('Can not load data. Contact support'));
                })
                .then(function(){
                    m.onLoadingEnd();
                })
        };

        this.getSignersCounters = function () {

            return Auth.loadAccountById(Conf.master_key)
                .then(function(source){
                    var signers = source.signers;
                    var cnt_adm = 0;
                    var cnt_ems = 0;
                    Object.keys(signers).forEach(function(key) {
                        var signer = signers[key];
                        if (
                            signer.weight == Conf.roles.admin &&
                            signer.signertype == StellarSdk.xdr.SignerType.signerAdmin().value
                        ) {
                            cnt_adm++;
                        } else if (
                            signer.weight == Conf.roles.emission &&
                            signer.signertype == StellarSdk.xdr.SignerType.signerEmission().value
                        ) {
                            cnt_ems++;
                        }
                    });
                    ctrl.cnt_adm(cnt_adm);
                    ctrl.cnt_ems(cnt_ems);
                })
                .catch(function (err) {
                    console.error(err);
                });

        };

        this.getLastPayments = function () {

            return Conf.horizon.payments()
                .order('desc')
                .limit(Conf.payments.onmain)
                .call()
                .then(function (result) {
                    m.startComputation();
                    ctrl.last_payments(result.records);
                    if (result.records.length > 0) {
                        ctrl.last_payment_time(result.records[0].closed_at);
                    }
                    m.endComputation();
                });
        };

        this.getData();

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {
                            ctrl.loaded() ?
                                <div>
                                    <div class="text-center row">
                                        <div class="col-xs-12 col-md-12 col-lg-4">
                                            <div class="card-box">
                                                <h3 class="text-primary"><span class="counter" id="cnt_adm">{ctrl.cnt_adm()}</span></h3>
                                                <p class="text-muted">{Conf.tr('Administators keys')}</p>
                                            </div>
                                        </div>
                                        <div class="col-xs-12 col-md-12 col-lg-4">
                                            <div class="card-box">
                                                <h3 class="text-primary"><span class="counter" id="cnt_ems">{ctrl.cnt_ems()}</span></h3>
                                                <p class="text-muted">{Conf.tr('Emission keys')}</p>
                                            </div>
                                        </div>
                                        <div class="col-xs-12 col-md-12 col-lg-4">
                                            <div class="card-box">
                                                <h3 class="text-primary"><span>{DateFormat(ctrl.last_payment_time(), 'dd.mm.yyyy HH:MM:ss')}</span></h3>
                                                <p class="text-muted">{Conf.tr('Last transaction time')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="clearfix"></div>
                                    <div class="panel panel-color panel-main hidden-md">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Last transactions")}</h3>
                                            <p class="panel-sub-title font-13">{Conf.tr("Overview of last recent transactions")}.</p>
                                        </div>
                                        <div class="panel-body">
                                            {m.component(Payments, {payments: ctrl.last_payments()})}
                                        </div>
                                        <div class="panel-footer text-center">
                                            <a href="/analytics" config={m.route}
                                               class="btn btn-primary btn-custom waves-effect w-md btn-sm waves-light">
                                                {Conf.tr("All transactions")}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                :
                                <div class="portlet">
                                    <div class="portlet-heading bg-warning">
                                        <h3 class="portlet-title">
                                            {Conf.tr('Wait for loading data')}...
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