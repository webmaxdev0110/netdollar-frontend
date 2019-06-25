var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

module.exports = {
    controller: function () {
        var ctrl = this;
        this.invoiceCode = m.prop(false);
        this.hdWallet = m.prop(false);
        this.balance = m.prop(false);
        this.invoice = m.prop(false);

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.createInvoice = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            var amount = e.target.amount.value

            StellarSdk.HDWallet.setByStrKey(Auth.keypair().seed(), Conf.horizon_host)
                .then(function (hdwallet) {
                    // УВАГА! Після данної операції слід перезберегти сереалізований гаманець!
                    var mpub = hdwallet.getMPublicNew();

                    return Auth.update({HDW: hdwallet.serialize()})
                        .then(function () {
                            return Conf.invoiceServer.createInvoiceHD({
                                amount: amount,
                                asset: 'EUAH',
                                mpub: mpub
                            })
                        })
                })
                .then(id => {
                    m.flashSuccess(Conf.tr("Invoice created"));

                    m.startComputation();
                    ctrl.invoiceCode(id);
                    m.endComputation();
                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })
        }

        this.getInvoice = function (e) {
            if (!this.hdWallet()) {
                return m.flashError(Conf.tr("HD Wallet not available"));
            }

            e.preventDefault();
            m.onLoadingStart();

            Conf.invoiceServer.getInvoiceHD({
                    id: e.target.code.value,
                })
                .then(invoice => {

                    return StellarSdk.HDWallet.setByStrKey(invoice.mpub, Conf.horizon_host)
                        .then(function (hdwallet) {
                            invoice.wallets = hdwallet.makeInvoiceList(invoice.amount)
                            return invoice;
                        })
                })

                .then(function (invoice) {
                    m.startComputation();
                    ctrl.invoice(invoice);
                    m.endComputation();

                    m.flashSuccess(Conf.tr("Invoice requested"));
                })

                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })
        }

        this.newForm = function () {
            this.invoiceCode(false);
            this.invoice(false);
        }

        this.makePayment = function (e) {
            e.preventDefault();

            if (!ctrl.hdWallet()) {
                return m.flashError(Conf.tr("HD Wallet not available"));
            }

            if (!ctrl.invoice()) {
                return m.flashError(Conf.tr("HD Invoice not available"));
            }

            var asset = new StellarSdk.Asset(ctrl.invoice().asset, Conf.master_key);
            return ctrl.hdWallet().doPayment(ctrl.invoice().wallets, asset)
                .then(function () {
                    m.flashSuccess('Payment successful');
                })
                .catch(function (err) {
                    console.log(err);
                    m.flashError('Cannot make payment');
                });
        }


        m.onLoadingStart();

        var hdw = Auth.wallet().HDW;
        console.log(hdw, Auth.keypair().seed());
        // StellarSdk.HDWallet.setByStrKey(!hdw ? Auth.keypair().seed() : hdw, Conf.horizon_host)
        StellarSdk.HDWallet.setByStrKey(Auth.keypair().seed(), Conf.horizon_host)
            .then(function (hdwallet) {
                // Виконати оновлення стану гаманця відштовхуючісь від
                // поточного стану hdwallet.refresh() або повне hdwallet.totalRefresh().
                if (hdw) {
                    return hdwallet.refresh();
                }

                return hdwallet.totalRefresh();
            })
            .then(function (hdwallet) {
                ctrl.hdWallet(hdwallet);

                // УВАГА! Після розгортання гаманця слід виконати оновлення його стану та перезберегти сереалізований гаманець!
                var serialized_wallet = hdwallet.serialize();
                if (serialized_wallet != hdw) {
                    return Auth.update({HDW: serialized_wallet});
                }
            })
            .then(function () {
                return ctrl.hdWallet().getBalance(new StellarSdk.Asset('EUAH', Conf.master_key));
            })
            .then(function (balance) {
                m.startComputation();
                ctrl.balance(balance);
                m.endComputation();
            })
            .catch(function (err) {
                console.log(err);
            })
            .then(function () {
                m.onLoadingEnd();
            });
    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <h2>{Conf.tr("Invoice")}</h2>

                    {ctrl.balance() ?
                        <div class="alert alert-success">BALANCE : {ctrl.balance()}</div>
                        :
                        ''
                    }

                    <div class="row">
                        <div class="col-lg-4">
                            {
                                (!ctrl.invoiceCode()) ?
                                    <div class="panel panel-primary">
                                        <div class="panel-heading">{Conf.tr("Create a new invoice")}</div>
                                        <div class="panel-body">
                                            <form class="form-horizontal" onsubmit={ctrl.createInvoice.bind(ctrl)}>

                                                <div class="form-group">
                                                    <div class="col-xs-4">
                                                        <label for="">{Conf.tr("Amount")}:</label>
                                                        <input class="form-control" type="number" required="required"
                                                               id="amount"
                                                               min="t"
                                                               placeholder="0.00"
                                                               name="amount"/>
                                                    </div>
                                                </div>
                                                <div class="form-group m-t-20">
                                                    <div class="col-sm-7">
                                                        <button
                                                            class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                            type="submit">
                                                            {Conf.tr("Create")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    :
                                    <div class="panel panel-border panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Invoice code")}</h3>
                                        </div>
                                        <div class="panel-body text-center">
                                            <h2>{ctrl.invoiceCode()}</h2>
                                            <i>{Conf.tr("Copy this invoice code and share it with someone you need to get money from")}</i>
                                            <br/>
                                            <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                                    onclick={ctrl.newForm.bind(ctrl)}>{Conf.tr("Create new")}
                                            </button>
                                        </div>
                                    </div>
                            }
                        </div>
                        <form class="col-sm-4" onsubmit={ctrl.getInvoice.bind(ctrl)}>
                            <div class="panel panel-primary">
                                <div class="panel-heading">{Conf.tr("Pay by invoice code")}</div>
                                <div class="panel-body">
                                    <div class="form-group">
                                        <label>{Conf.tr("Invoice code")}</label>
                                        <input type="text" name="code" required="required" class="form-control"/>
                                    </div>
                                    <div class="form-group">
                                        <button class="btn btn-primary">{Conf.tr("Request")}</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                        {
                            ctrl.invoice() ?
                                <div class="col-sm-12">
                                    <h3>Amount:</h3>
                                    {ctrl.invoice().amount}
                                    <h3>Asset:</h3>
                                    {ctrl.invoice().asset}
                                    <h3>To wallets:</h3>
                                    <div class="well">
                                        {ctrl.invoice().wallets.map(w => {
                                            return <div>Key: {w.key}<br/>
                                                Amount: {w.amount.toNumber()}
                                            </div>;
                                        })}
                                    </div>
                                    <button class="btn btn-success" onclick={ctrl.makePayment.bind(ctrl)}>Send!</button>
                                </div>
                                :
                                ''
                        }
                        <div class="clearfix"></div>
                    </div>
                </div>
            </div>
        ];
    }
};
