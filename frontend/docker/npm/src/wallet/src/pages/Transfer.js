var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

    controller: function () {
        var ctrl = this;

        //return phone in pattern or prefix
        this.getPhoneWithViewPattern = function (number) {
            if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.addPhoneViewPattern = function (e) {
            ctrl.infoPhone = ctrl.getPhoneWithViewPattern(e.target.value);
        };

        this.infoAsset = m.prop(m.prop(m.route.param('asset') ? m.route.param('asset') : ''));
        this.infoAmount = m.prop(m.route.param("amount") ? m.route.param("amount") : '');
        this.infoAccount = m.prop(m.route.param("account") ? m.route.param("account") : '');
        this.infoPhone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix);
        this.infoEmail = m.prop(m.route.param("email") ? m.route.param("email") : '');
        this.transferType = m.prop('byAccount');
        this.infoMemo = m.prop('by_account');

        if (!Auth.keypair()) {
            return m.route('/');
        }
        Conf.SmartApi.Api.refreshNonce();

        this.changeTransferType = function (e) {
            e.preventDefault();
            m.startComputation();
            this.transferType(e.target.value);
            this.infoAccount = m.prop('');
            this.infoPhone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix);
            this.infoEmail = m.prop('');
            switch (e.target.value) {
                case 'byAccount':
                    this.infoMemo('by_account');
                    break;
                case 'byPhone':
                    this.infoMemo('by_phone');
                    break;
                case 'byEmail':
                    this.infoMemo('by_email');
                    break;
                default:
                    this.infoMemo('');
            }
            m.endComputation();
        };

        this.getInvoice = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            Conf.SmartApi.Invoices.get({
                    id: e.target.code.value,
                })
                .then(response => {
                    if (!response || typeof response.data == 'undefined') {
                        console.error('Unexpected response');
                        console.error(response);

                        return m.flashError(Conf.tr("Service error"));
                    }
                    response = response.data;

                    var allow_inv = false;
                    Auth.assets().map(function (asset) {
                        if (asset == response.asset) {
                            allow_inv = true;
                        }
                    });

                    if (!allow_inv) {
                        return m.flashError(Conf.tr("Invalid invoice currency"));
                    }

                    m.startComputation(); // TODO: add this to form
                    this.infoAsset(response.asset);
                    this.infoAmount(response.amount);
                    this.infoAccount(response.account);
                    this.transferType('byAccount');

                    if (typeof response.memo == 'string' && response.memo.length > 0
                        && response.memo.length <= 14
                    ) {
                        this.infoMemo(response.memo);
                    } else {
                        this.infoMemo('by_invoice');
                    }

                    // Clear input data
                    e.target.code.value = '';
                    m.endComputation();

                    return m.flashSuccess(Conf.tr("Invoice requested"));
                })
                .catch(error => {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not request invoice"));
                })
                .then(() => {
                    Conf.SmartApi.Api.refreshNonce();
                    return m.onLoadingEnd();
                })
        };

        this.commitPayment = function (e) {
            e.preventDefault();

            var accountId = e.target.account.value;
            var memoText = e.target.memo.value.replace(/<\/?[^>]+(>|$)/g, ""); //delete html tags from memo
            var amount = parseFloat(e.target.amount.value);
            var asset = e.target.asset.value;

            if (!amount || amount < 0) {
                return m.flashError(Conf.tr("Amount is invalid"));
            }

            if (memoText.length > 14) {
                return m.flashError(Conf.tr("Memo text is too long"));
            }

            switch(this.transferType()) {
                case 'byAccount':
                    ctrl.processPayment(accountId, memoText, amount, asset);
                    break;
                case 'byPhone':
                    var phoneNum = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask).substr(2);

                    if (phoneNum.length > 0 && phoneNum.match(/\d/g).length != Conf.phone.length) {
                        return m.flashError(Conf.tr("Invalid phone"));
                    }

                    Conf.SmartApi.Wallets.getWalletData({
                            phone : phoneNum
                        })
                        .then(function (walletData) {
                            if (walletData && walletData.data.accountId) {
                                ctrl.processPayment(walletData.data.accountId, memoText, amount, asset);
                            }
                        })
                        .catch(function (err) {
                            return m.flashError(Conf.tr("User not found! Check phone number"));
                        });
                    break;
                case 'byEmail':
                    var email = e.target.email.value.toLowerCase();

                    if (email === '') {
                        return m.flashError(Conf.tr("Please fill all the fields"));
                    }

                    Conf.SmartApi.Wallets.getWalletData({
                            email : email
                        })
                        .then(function (walletData) {
                            if (walletData && walletData.data.accountId) {
                                ctrl.processPayment(walletData.data.accountId, memoText, amount, asset);
                            }
                        })
                        .catch(function (err) {
                            return m.flashError(Conf.tr("User not found! Check email"));
                        });
                    break;
            }
        };

        this.processPayment = function (accountId, memoText, amount, asset) {
            if (!StellarSdk.Keypair.isValidPublicKey(accountId)) {
                return m.flashError(Conf.tr("Account is invalid"));
            }

            if (accountId == Auth.keypair().accountId()) {
                return m.flashError(Conf.tr("You cannot send money to yourself"));
            }

            m.startComputation();
            m.onLoadingStart();

            return Conf.horizon.loadAccount(Auth.keypair().accountId())
            // TODO: Do not add memo to tx if it's empty
                .then(function (source) {
                    var memo = StellarSdk.Memo.text(memoText);
                    var tx = new StellarSdk.TransactionBuilder(source, {memo: memo})
                        .addOperation(StellarSdk.Operation.payment({
                            destination: accountId,
                            amount: amount.toString(),
                            asset: new StellarSdk.Asset(asset, Conf.master_key)
                        }))
                        .build();

                    tx.sign(Auth.keypair());

                    return Conf.horizon.submitTransaction(tx);
                })
                .then(function () {
                    m.flashSuccess(Conf.tr("Transfer successful"));
                })
                .catch(function (err) {
                    m.flashError(Conf.tr("Cannot make transfer"));
                })
                .then(function () {
                    ctrl.infoAsset('');
                    ctrl.infoAmount('');
                    ctrl.infoAccount('');
                    ctrl.infoPhone('');
                    ctrl.infoEmail('');
                    m.endComputation();
                    Conf.SmartApi.Api.refreshNonce();
                });
        }
    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <form class="col-lg-6" onsubmit={ctrl.commitPayment.bind(ctrl)}>
                            <div class="panel panel-color panel-primary">
                                <div class="panel-heading">
                                    <h3 class="panel-title">{Conf.tr("Transfer money")}</h3>
                                </div>
                                <div class="panel-body">
                                    <div class="form-group">
                                        <label>{Conf.tr("Transfer type")}</label>
                                        <select name="transType" required="required" class="form-control"
                                                onchange={ctrl.changeTransferType.bind(ctrl)}
                                                value={ctrl.transferType()}
                                        >
                                            <option value="byAccount">{Conf.tr("by account ID")}</option>
                                            <option value="byPhone">{Conf.tr("by phone")}</option>
                                            <option value="byEmail">{Conf.tr("by email")}</option>
                                        </select>
                                    </div>
                                    <div class="form-group"
                                         class={(ctrl.transferType() != 'byAccount') ? 'hidden' : ''}>
                                        <label>{Conf.tr("Account ID")}</label>
                                        <input name="account"
                                               oninput={m.withAttr("value", ctrl.infoAccount)} pattern=".{56}"
                                               title={Conf.tr("Account ID should have 56 symbols")}
                                               class="form-control"
                                               value={ctrl.infoAccount()}/>
                                    </div>
                                    <div class="form-group"
                                         class={(ctrl.transferType() != 'byPhone') ? 'hidden' : ''}>
                                        <label>{Conf.tr("Phone number")}</label>
                                        <input name="phone"
                                               class="form-control"
                                               placeholder={Conf.phone.view_mask}
                                               oninput={ctrl.addPhoneViewPattern.bind(ctrl)}
                                               value={ctrl.infoPhone()}/>
                                    </div>
                                    <div class="form-group"
                                         class={(ctrl.transferType() != 'byEmail') ? 'hidden' : ''}>
                                        <label>{Conf.tr("Email")}</label>
                                        <input name="email"
                                               type="email"
                                               class="form-control"
                                               oninput={m.withAttr("value", ctrl.infoEmail)}
                                               value={ctrl.infoEmail()}/>
                                    </div>
                                    <div class="form-group">
                                        <label>{Conf.tr("Amount")}</label>
                                        <input type="number" required="required" name="amount"
                                               min="0.01"
                                               step="0.01"
                                               placeholder="0.00"
                                               class="form-control"
                                               oninput={m.withAttr("value", ctrl.infoAmount)}
                                               value={ctrl.infoAmount()}/>
                                    </div>
                                    <div class="form-group">
                                        <label>{Conf.tr("Asset")}</label>
                                        <select name="asset" required="required" class="form-control">
                                            {Auth.assets().map(function (asset) {
                                                return <option
                                                        value={asset}
                                                        selected={ctrl.infoAsset() && ctrl.infoAsset() == asset ? 'selected' : ''}
                                                    >
                                                        {asset}
                                                    </option>
                                            })}
                                        </select>
                                    </div>
                                    <div class="form-group" style="display:none;">
                                        <label>{Conf.tr("Memo message")}</label>
                                        <input name="memo"
                                               size="14" maxlength="14"
                                               disabled="disabled"
                                               oninput={m.withAttr("value", ctrl.infoMemo)}
                                               class="form-control"
                                               value={ctrl.infoMemo()}/>
                                    </div>
                                    <div class="form-group">
                                        <button class="btn btn-primary btn-custom">{Conf.tr("Transfer")}</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <form class="col-lg-6" onsubmit={ctrl.getInvoice.bind(ctrl)}>
                            <div class="panel panel-color panel-primary">
                                <div class="panel-heading">
                                    <h3 class="panel-title">{Conf.tr("Pay by invoice code")}</h3>
                                </div>
                                <div class="panel-body">
                                    <div class="form-group">
                                        <label>{Conf.tr("Invoice code")}</label>
                                        <input type="number" name="code" required="required" class="form-control"/>
                                    </div>
                                    <div class="form-group">
                                        <button class="btn btn-primary btn-custom">{Conf.tr("Request")}</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div class="clearfix"></div>
                    </div>
                </div>
            </div>
        ];
    }

};