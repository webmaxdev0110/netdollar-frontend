var Conf = require('../config/Config.js'),
    Navbar = require('../components/Navbar.js'),
    Footer = require('../components/Footer.js'),
    Auth = require('../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.accepted = m.prop(false);
        this.declined = m.prop(false);
        this.mnemonic_only = m.prop(false);
        this.mnemonic_phrase = m.prop(false);

        if (!Auth.enrollment()) {
            return m.route('/');
        }
        if (Auth.type() != 'agent') {
            return m.route('/');
        }

        this.setMnemonicMode = function (e) {
            m.startComputation();
            ctrl.mnemonic_only(e.target.checked);
            m.endComputation();
        };

        this.acceptEnrollment = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            return Promise.resolve()
                .then(() => {
                    if (ctrl.mnemonic_only()) {
                        return Promise.resolve();
                    }
                    if (!e.target.login || !e.target.password || !e.target.password_confirm) {
                        return Promise.reject(Conf.tr('Fill all required fields'));
                    }
                    if (e.target.password.value != e.target.password_confirm.value) {
                        return Promise.reject(Conf.tr('Passwords must be equal'));
                    }
                    return Conf.SmartApi.Wallets.create({
                        username: e.target.login.value,
                        password: e.target.password.value,
                        accountId: Auth.keypair().accountId(),
                        publicKey: Auth.keypair().rawPublicKey().toString('base64'),
                        keychainData: Auth.keypair().seed(),
                        mainData: 'mainData'
                    });
                })
                .then(function () {
                    return Conf.horizon.assets().call();
                }).then(function (assets) {
                    var sequence = '0';
                    var agentAccount = new StellarSdk.Account(Auth.keypair().accountId(), sequence);
                    var txBuilder = new StellarSdk.TransactionBuilder(agentAccount);

                    assets.records.map(function (asset) {
                        txBuilder.addOperation(
                            StellarSdk.Operation.changeTrust({
                                asset: new StellarSdk.Asset(asset.asset_code, Conf.master_key)
                            }));
                    });

                    var tx = txBuilder.build();
                    tx.sign(Auth.keypair());
                    var xdr = tx.toEnvelope().toXDR().toString("base64");
                    return Conf.SmartApi.Enrollments.accept({
                        id: Auth.enrollment().id,
                        token: Auth.enrollment().otp,
                        account_id: Auth.keypair().accountId(),
                        tx_trust: xdr,
                        login: typeof e.target.login != 'undefined' ? e.target.login.value : null
                    });
                }).then(function () {
                    m.startComputation();
                    ctrl.accepted(true);
                    ctrl.mnemonic_phrase(StellarSdk.getMnemonicFromSeed(Auth.keypair().seed()));
                    m.endComputation();
                    swal(Conf.tr("Accepted") + "!",
                        Conf.tr("Enrollment successfully accepted"),
                        "success"
                    );
                }).catch(function (err) {
                    console.error(err);
                    if (typeof err == 'string') {
                        return m.flashError(err);
                    }
                    return m.flashApiError(err);
                }).then(function () {
                    m.onLoadingEnd();
                })
        };

        this.declineEnrollment = function () {
            m.onLoadingStart();
            swal({
                title: Conf.tr("Decline enrollment") + '?',
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: Conf.tr("Yes, decline it"),
                cancelButtonText: Conf.tr("Cancel"),
                closeOnConfirm: false,
                html: false
            }, function () {
                return Conf.SmartApi.Enrollments.decline({
                    id: Auth.enrollment().id,
                    token: Auth.enrollment().otp
                }).then(function () {
                    m.startComputation();
                    ctrl.declined(true);
                    m.endComputation();
                    swal(Conf.tr("Declined") + "!",
                        Conf.tr("Your enrollment has been declined"),
                        "success"
                    );
                }).catch(function (err) {
                    console.error(err);
                    if (typeof err == 'string') {
                        return m.flashError(err);
                    }
                    return m.flashApiError(err);
                }).then(function () {
                    m.onLoadingEnd();
                })
            });
        }
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="col-md-8 col-md-offset-2">
                            {
                                ctrl.accepted() || ctrl.declined() ?
                                    <div>
                                        {
                                            ctrl.accepted() ?
                                                <div>
                                                    <div class="alert alert-success">
                                                        {Conf.tr("Enrollment successfully accepted")}
                                                    </div>
                                                    <div>
                                                        <h4>{Conf.tr('Please, remember mnemonic phrase - it is NOT recoverable')}</h4>
                                                        <kbd
                                                            style="word-break: break-word; display: block;">{ctrl.mnemonic_phrase()}</kbd>
                                                    </div>
                                                </div>
                                                :
                                                <div class="alert alert-warning">
                                                    <strong>{Conf.tr('Warning') + "!"}</strong> {Conf.tr("Your enrollment has been declined")}
                                                </div>
                                        }
                                    </div>
                                    :
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Agent registration')}</h3>
                                            <p class="panel-sub-title font-13">
                                                {Conf.tr('Compose your login and password or decline enrollment')}
                                            </p>
                                        </div>
                                        <div class="panel-body">
                                            <div class="col-md-6">
                                                <form id="reg_form" method="post" role="form"
                                                      onsubmit={ctrl.acceptEnrollment.bind(ctrl)}>
                                                    <div class="checkbox checkbox-danger checkbox-circle">
                                                        <input id="mnemonic_only" type="checkbox"
                                                               onchange={ctrl.setMnemonicMode.bind(ctrl)}/>
                                                        <label for="mnemonic_only" class="text-danger">
                                                            {Conf.tr('Don\'t create account (mnemonic phrase only)')}
                                                        </label>
                                                    </div>
                                                    {
                                                        ctrl.mnemonic_only() ?
                                                            ''
                                                            :
                                                            <div>
                                                                <div class="form-group">
                                                                    <div>{Conf.tr('Login')}:</div>
                                                                    <input type="text" class="form-control" id="login"
                                                                           name="login" required="required"/>
                                                                </div>

                                                                <div class="form-group">
                                                                    <div>{Conf.tr('Password')}:</div>
                                                                    <input type="password" class="form-control"
                                                                           id="password" name="password"
                                                                           required="required"/>
                                                                </div>

                                                                <div class="form-group">
                                                                    <div>{Conf.tr('Repeat password')}:</div>
                                                                    <input type="password" class="form-control"
                                                                           id="password_confirm" name="password_confirm"
                                                                           required="required"/>
                                                                </div>
                                                            </div>
                                                    }
                                                    <div class="form-group m-b-0">
                                                        <div class="col-md-offset-1 col-md-10 text-center">
                                                            <button type="submit"
                                                                    class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5 m-r-15">
                                                                {Conf.tr("Accept")}
                                                            </button>
                                                            <button type="button"
                                                                    class="btn btn-danger btn-custom waves-effect w-md waves-light m-b-5 m-r-0"
                                                                    onclick={ctrl.declineEnrollment}
                                                            >
                                                                {Conf.tr("Decline")}
                                                            </button>
                                                        </div>
                                                    </div>

                                                </form>
                                            </div>
                                            <div class="col-md-6">
                                                <table class="table m-0">
                                                    <tbody>
                                                    <tr>
                                                        <th>{Conf.tr('Company code')}</th>
                                                        <td>{Auth.enrollment().company_data.code}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{Conf.tr('Company title')}</th>
                                                        <td>{Auth.enrollment().company_data.title}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{Conf.tr('Company address')}</th>
                                                        <td>{Auth.enrollment().company_data.address}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{Conf.tr('Company phone')}</th>
                                                        <td>{Auth.enrollment().company_data.phone}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>{Conf.tr('Company email')}</th>
                                                        <td>{Auth.enrollment().company_data.email}</td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};