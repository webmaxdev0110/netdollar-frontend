var Qr = require('kjua');
var Conf = require('../../config/Config.js');
var Wrapper = require('../../components/Wrapper.js');
var Auth = require('../../models/Auth.js');

var Invoice = module.exports = {

    controller: function () {
        var ctrl = this;

        this.invoiceCode = m.prop(false);
        this.qr = m.prop(false);

        if (!Auth.keypair() || Auth.type() != 'settlement') {
            return m.route('/');
        }

        //create invoice function
        this.createInvoice = function (e) {
            e.preventDefault();

            var amount = e.target.amount.value;
            var asset = e.target.asset.value;

            m.onLoadingStart();

            Conf.SmartApi.Invoices.create({asset: asset, amount: parseFloat(parseFloat(amount).toFixed(2))})
                .then(function (response) {
                    if (
                        !response ||
                        typeof response.data == 'undefined' ||
                        typeof response.data.id == 'undefined') {
                        console.error('Unexpected response');
                        console.error(response);
                        return m.flashError(Conf.tr("Service error. Contact support"));
                    }
                    m.flashSuccess(Conf.tr("Invoice created"));
                    ctrl.invoiceCode(response.data.id);

                    // QR-CODE
                    var qrData = {
                        "account": Auth.keypair().accountId(),
                        "amount": amount,
                        "asset": asset,
                        "t": 1
                    };

                    var qrCode = Qr({
                        text: JSON.stringify(qrData),
                        crisp: true,
                        fill: '#000',
                        ecLevel: 'Q',
                        size: 200,
                        minVersion: 4
                    });

                    m.startComputation();
                    ctrl.qr(qrCode);
                    m.endComputation();
                })
                .catch(error => {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not create invoice"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

        this.newForm = function (e) {
            this.invoiceCode(false);
        }
    },

    view: function (ctrl) {
        var code = ctrl.qr();

        return m.component(Wrapper, {
            title: Conf.tr("Invoices"),
            tpl: <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-6">
                            {
                                (!ctrl.invoiceCode()) ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Create a new invoice")}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <form class="form-horizontal" onsubmit={ctrl.createInvoice.bind(ctrl)}>

                                                <div class="form-group">
                                                    <div class="col-xs-4">
                                                        <label for="">{Conf.tr("Amount")}:</label>
                                                        <input class="form-control" type="number" required="required"
                                                               id="amount"
                                                               min="0.01"
                                                               step="0.01"
                                                               placeholder="0.00"
                                                               name="amount"/>
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <div class="col-xs-4">
                                                        <select name="asset" class="form-control">
                                                            {Auth.assets().map(function (asset) {
                                                                return <option>{asset}</option>
                                                            })}
                                                        </select>
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
                                            <br/>
                                            <img src={code.src}/>
                                            <br/>
                                            <br/>
                                            <br/>
                                            <br/>
                                            <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                                    onclick={ctrl.newForm.bind(ctrl)}>{Conf.tr("Create new")}
                                            </button>
                                        </div>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        });
    }
};