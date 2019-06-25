var AuthNavbar = require('../components/AuthNavbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var PhraseWizard = require('../components/PhraseWizard.js');
var Qr = require('kjua');
var ProgressBar = require('../components/ProgressBar');

var Sign = module.exports = {
    controller: function () {
        var ctrl = this;
        if (Auth.keypair()) {
            return m.route('/home');
        }

        this.qr = m.prop(false);
        this.mnemonic = m.prop(false);
        this.showMnemonic = m.prop(false);

        this.progress = m.prop(0);
        this.showProgress = m.prop(false);

        this.getPhoneWithViewPattern = function (number) {
            if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.addPhoneViewPattern = function (e) {
            ctrl.login = ctrl.getPhoneWithViewPattern(e.target.value);
        };

        this.login = ctrl.getPhoneWithViewPattern(Conf.phone.prefix);

        Auth.setListener(function (progress) {
            ctrl.progress(progress);
        });

        this.onunload = function() {
            Auth.removeListener();
        };


        this.signup = function (e) {
            e.preventDefault();
            
            var login = e.target.login.value;
            var password = e.target.password.value;
            var rePassword = e.target.repassword.value;

            if (!login || !password || !rePassword) {
                return m.flashError(Conf.tr("Please, fill all required fields"));
            }

            let phoneNum = VMasker.toPattern(login, Conf.phone.db_mask).substr(2);

            if (phoneNum.length > 0 && phoneNum.match(/\d/g).length != Conf.phone.length) {
                return m.flashError(Conf.tr("Invalid phone"));
            }

            if (password.length < 8) {
                return m.flashError(Conf.tr("Password should have 8 chars min"));
            }

            let regex = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{1,}$/;
            if (!regex.test(password)) {
                return m.flashError(Conf.tr("Password must contain at least one upper case letter, one lower case letter and one digit"));
            }

            if (password != rePassword) {
                return m.flashError(Conf.tr("Passwords should match"));
            }

            ctrl.showProgress(true);
            m.onLoadingStart();
            var accountKeypair = StellarSdk.Keypair.random();
            var mnemonicPhrase = StellarSdk.getMnemonicFromSeed(accountKeypair.seed(), Conf.mnemonic.locale);

            Auth.registration(accountKeypair, phoneNum, password)
                .then(function (wallet) {
                    return Auth.loginByPasswordHash(phoneNum, wallet.passwordHash)
                })
                .then(function () {
                    m.onLoadingEnd();
                    m.startComputation();
                    ctrl.showProgress(false);
                    ctrl.progress(0);
                    m.endComputation();
                    var qr = Qr({
                        text: mnemonicPhrase,
                        crisp: true,
                        fill: '#000',
                        ecLevel: 'L',
                        size: 260
                    });
                    m.startComputation();
                    ctrl.qr(qr);
                    ctrl.mnemonic(mnemonicPhrase);
                    m.endComputation();
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
        };

        this.goNext = function (e) {
            e.preventDefault();
            ctrl.showMnemonic(true);
        };
    },

    view: function (ctrl) {
        if (ctrl.showMnemonic()) {
            return Sign.viewMnemonic(ctrl);
        }

        if (ctrl.qr()) {
            return Sign.viewQRCode(ctrl);
        }

        return <div>
            {m.component(AuthNavbar)}
            <div class="wrapper-page">

                {ctrl.showProgress() ?
                    <div class="form-group m-t-10">
                        {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Encrypting your account for security")})}
                    </div>
                    :
                    <div class="auth-form">
                        <div class="text-center">
                            <h3>{Conf.tr("Create a new account")}</h3>
                        </div>
                        <form class="form-horizontal m-t-30" onsubmit={ctrl.signup.bind(ctrl)}>
                            <div id="by-login" class="tab-pane active">
                                <div class="form-group">
                                    <div class="col-xs-12">
                                        <input class="form-control" type="tel" name="login" required="required"
                                               placeholder={Conf.tr("Enter your mobile phone number: ") + Conf.phone.view_mask}
                                               title={Conf.tr("Ukrainian phone number format allowed: +38 (050) 123-45-67")}
                                               oninput={ctrl.addPhoneViewPattern.bind(ctrl)}
                                               value={ctrl.login()}
                                        />
                                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="col-xs-12">
                                        <input class="form-control" type="password"
                                               autocapitalize="none"
                                               placeholder={Conf.tr("Password")} name="password" pattern=".{6,}"
                                               title={Conf.tr("6 characters minimum")}/>
                                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="col-xs-12">
                                        <input class="form-control" type="password"
                                               autocapitalize="none"
                                               placeholder={Conf.tr("Retype Password")} name="repassword" pattern=".{6,}"
                                               title={Conf.tr("6 characters minimum")}/>
                                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group m-t-20 text-center">
                                <button class="form-control btn btn-primary btn-lg btn-custom waves-effect w-md waves-light m-b-5">
                                    {Conf.tr("Create")}</button>
                            </div>
                        </form>

                        <div class="m-t-10">
                            <a href="/" config={m.route} class="">{Conf.tr("Log in")}</a>
                            {
                                Conf.help_url ?
                                    <a href={Conf.help_url} target="_blank"
                                       class="pull-right">{Conf.tr("Help")}</a>
                                    :
                                    ''
                            }

                        </div>
                    </div>
                }
            </div>
        </div>
    },

    viewQRCode: function (ctrl) {
        var code = ctrl.qr();
        ctrl.qr(false);

        return <div class="wrapper-page">
            <div>
                <div class="panel panel-color panel-success">
                    <div class="panel-heading">
                        <h3 class="panel-title">{Conf.tr("Account successfully created")}</h3>
                        <p class="panel-sub-title font-13">{Conf.tr("This is a QR-code with a mnemonic phrase that is used for account recovering. It is very important to keep your mnemonic phrase in a safe and private place")}!</p>
                    </div>
                    <div class="panel-body">
                        <div class="text-center">
                            <p><img src={code.src} alt=""/></p>
                            <p><a href={code.src} download="qr_mnemonic.png">{Conf.tr("Save code")}</a></p>
                            <button className="btn btn-success btn-custom waves-effect w-md waves-light m-b-5 m-t-10"
                                    onclick={ctrl.goNext.bind(ctrl)}>{Conf.tr("Next")}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    },

    viewMnemonic: function (ctrl) {
        return m.component(PhraseWizard, {
            phrase: ctrl.mnemonic()
        })
    }


};
