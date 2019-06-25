var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Payments = require('../components/Payments.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');
var Session = require('../models/Session.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }
        Conf.SmartApi.Api.refreshNonce();

        this.getPhoneWithViewPattern = function (number) {
            if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.username = Auth.username() ? ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.username()) : null;

        // We'll query balances on each page load until we receive some money and start a stream
        if (!Auth.payments().length) {
            Auth.updateBalances(Auth.keypair().accountId())
                .then(function (source) {
                    if (source) {
                        Auth.type(source.type);
                    }

                    return Conf.horizon.payments()
                        .forAccount(Auth.keypair().accountId())
                        .order('desc')
                        .limit(Conf.payments.onpage)
                        .call();
                })
                .then(function (result) {
                    m.startComputation();
                    Auth.payments(result.records);
                    m.endComputation();

                    return Conf.horizon.payments()
                        .forAccount(Auth.keypair().accountId())
                        .cursor('now')
                        .stream({
                            onmessage: function (message) {
                                var result = message.data ? JSON.parse(message.data) : message;
                                m.startComputation();
                                Auth.payments().unshift(result);
                                m.endComputation();

                                // Update user balance
                                Auth.updateBalances(Auth.keypair().accountId());
                            },
                            onerror: function () {
                                console.log('Cannot get payment from stream');
                            }
                        });
                })
                .catch(err => {
                    console.log(err);
                    // If you're here, everything's still ok - it means acc wasn't created yet
                });
        }
    },

    view: function (ctrl) {
        var type = Auth.type() ? Auth.type() : 'anonymous_user';
        return [
            m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="card-box widget-user info-block">
                                <div>
                                    <img src="/assets/img/no-avatar.png" class="img-responsive img-circle" alt="user"/>
                                    <div class="wid-u-info">
                                        {(Auth.username()) ?
                                          <h4 class="m-t-0 m-b-5">{Conf.tr("Welcome")}, {ctrl.username()}</h4> : ''
                                        }
                                        <p>
                                            <button
                                                class="btn-xs btn-warning waves-effect waves-light m-t-10"
                                                onclick={function(){
                                                    Session.modal(Auth.keypair().accountId(), Conf.tr("Your account"))
                                                }}
                                            >{Conf.tr("Show account")}</button>
                                        </p>
                                        <small class="text-inverse">
                                            <b>{Conf.tr(type)}</b></small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="modal fade show_account" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true" style="display: none;">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                                        <h4 class="modal-title" id="modalLabel">{Conf.tr("Your account")}</h4>
                                    </div>
                                    <div class="modal-body">
                                        <code class="long_string">{Auth.keypair().accountId()}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="widget-simple text-center card-box info-block">
                                <h3 class="text-primary counter">
                                    {Auth.balances().length ?
                                        Auth.balances().map(b => {
                                            return <span class="label label-primary label-price">
                                                    {parseFloat(b.balance).toFixed(2) + " " + b.asset}
                                                </span>
                                        })
                                        :
                                        '0.00'
                                    }
                                </h3>
                                <p style="margin-bottom: 8px;">
                                    <a
                                    class="btn btn-success btn-custom waves-effect w-md btn-sm waves-light"
                                    target="_blank"
                                    title={Conf.tr('Add funds')}
                                    href={Conf.exchange_host + "/cashin/privat24?acc="+Auth.keypair().accountId()}>{Conf.tr("Add funds")}</a>
                                </p>
                            </div>
                        </div>

                        <div class="clearfix"></div>
                    </div>

                    <div class="panel panel-color panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                            <p class="panel-sub-title font-13">{Conf.tr("Overview of recent transactions")}.</p>
                        </div>

                        <div class="panel-body">
                            {m.component(Payments, {payments: Auth.payments()})}
                        </div>

                        <div class="panel-footer text-center">
                            <a href="/payments" config={m.route}
                               class="btn btn-primary btn-custom waves-effect w-md btn-sm waves-light">
                                {Conf.tr("All transactions")}
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
