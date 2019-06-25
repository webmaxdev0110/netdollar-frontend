var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth.js'),
    Helpers = require('../components/Helpers.js'),
    Navbar = require('../components/Navbar.js'),
    Footer = require('../components/FooterFullWidth.js');

var Sign = module.exports = {
    controller: function () {
        var ctrl = this;

        this.registered = m.prop(false);
        this.mnemonic_phrase = m.prop('');

        if (Auth.keypair()) {
            return m.route('/home');
        }


        this.generateTx = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            var login       = e.target.login.value;
            var password    = e.target.password.value;
            var repassword  = e.target.repassword.value;

            if (!login || !password || !repassword) {
                return m.flashError(Conf.tr('Please, fill all required fields'));
            }

            if (password.length < 6) {
                return m.flashError(Conf.tr('Password should have 6 chars min'));
            }

            if (password != repassword) {
                return m.flashError(Conf.tr('Passwords should match'));
            }

            var admin_keypair = StellarSdk.Keypair.random();

            // Check if login already exists
            return Conf.SmartApi.Wallets.notExist({
                username: login
            })
            .then(function(){
                Conf.horizon.loadAccount(Conf.master_key)
                    .then(function (source) {
                        var tx = new StellarSdk.TransactionBuilder(source)
                            .addOperation(StellarSdk.Operation.setOptions({
                                signer: {
                                    pubKey: admin_keypair.accountId(),
                                    weight: StellarSdk.xdr.SignerType.signerAdmin().value,
                                    signerType: StellarSdk.xdr.SignerType.signerAdmin().value
                                }
                            }))
                            .build();
                        var data = JSON.stringify({
                            tx: tx.toEnvelope().toXDR().toString("base64"),
                            seed: Helpers.encryptData(admin_keypair.seed(), password),
                            account: admin_keypair.accountId(),
                            login: login,
                            operation: 'admin_create'
                        });
                        Helpers.download('create_admin_transaction.smb', data);
                        m.onLoadingEnd();
                        $(e.target).trigger('reset');
                    })
                    .catch(function (e) {
                        console.error(e);
                        return m.flashError(Conf.tr('Transaction error'));
                    })
            })
            .catch(function (err) {
                console.error(err);
                return m.flashError(Conf.tr('Login already exist'));;
            })
        };

        this.uploadTx = function (e) {
            m.onLoadingStart();

            var file = e.target.files[0];
            if (!file) {
                return m.flashError(Conf.tr("Bad file"));
            }

            var reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function (evt) {
                if (!evt.target.result) {
                    return m.flashError(Conf.tr("Bad file"));
                }
                try {
                    var data = JSON.parse(evt.target.result);
                } catch (e) {
                    return m.flashError(Conf.tr("Bad file"));
                }
                if (typeof data.operation == 'undefined') {
                    return m.flashError(Conf.tr("Bad file"));
                }
                if (data.operation != 'admin_create') {
                    return m.flashError(Conf.tr("Invalid operation with file ") + data.operation + " " + Conf.tr("Ensure file is correct"));
                }
                if (!data.account && !data.seed && !data.hash) {
                    return m.flashError(Conf.tr("Bad file"));
                }
                var tx = new StellarSdk.Transaction(data.tx);
                m.getPromptValue(Conf.tr('Enter password'))
                    .then(function (password) {
                        try {
                            var seed = sjcl.decrypt(password, atob(data.seed));
                        } catch (err) {
                            m.flashError(Conf.tr("Bad password"));
                            throw new Error(Conf.tr('Bad password'));
                        }
                        var keypair = StellarSdk.Keypair.fromSeed(seed);

                        m.startComputation();
                        ctrl.mnemonic_phrase(StellarSdk.getMnemonicFromSeed(keypair.seed()));
                        m.endComputation();

                        return Conf.SmartApi.Wallets.create({
                            username: data.login,
                            password: password,
                            accountId: keypair.accountId(),
                            publicKey: keypair.rawPublicKey().toString('base64'),
                            keychainData: keypair.seed(),
                            mainData: 'mainData'
                        });
                    })
                    .then(function () {
                        return Conf.horizon.submitTransaction(tx);
                    })
                    .then(function () {
                        m.startComputation();
                        ctrl.registered(true);
                        m.endComputation();
                        return m.flashSuccess(Conf.tr('Admin account created'));
                    })
                    .catch(function (err) {
                        console.error(err);
                        $("#upload_tx").replaceWith($("#upload_tx").val('').clone(true));
                        m.flashError(Conf.tr("Can not create admin account"));
                    })
            }
        };
    },

    view: function (ctrl) {
        return <div>
            <ul class="nav navbar-nav navbar-right pull-right hidden-xs lang-switcher">
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <img src={"/assets/img/flags/" + Conf.current_language + ".png"} alt=""/>
                        &nbsp; <i class="fa fa-caret-down"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-user">
                        <li>
                            <a onclick={Conf.loc.changeLocale.bind(ctrl, 'en')} href="#"><img
                                src="/assets/img/flags/en.png"/> English</a>
                            <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ua')} href="#"><img
                                src="/assets/img/flags/ua.png"/> Українська</a>
                            <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ru')} href="#"><img
                                src="/assets/img/flags/ru.png"/> Русский</a>
                        </li>
                    </ul>
                </li>
            </ul>

            <div class="wrapper-page">
                <div class="text-center logo">

                    <img src="/assets/img/logo.svg" alt="logo"/>
                    <h4>{Conf.tr('Admin Dashboard')}</h4>
                </div>
                {
                    ctrl.registered() ?
                        <div>
                            <div class="m-t-10 text-center">
                                <h4>{Conf.tr('Please, remember mnemonic phrase - it is NOT recoverable')}</h4>
                                <kbd
                                    style="word-break: break-word; display: block;">{ctrl.mnemonic_phrase()}</kbd>
                            </div>
                            <div class="m-t-10 text-center">
                                <a href="/" config={m.route}>{Conf.tr("Go to login")}</a>
                            </div>
                        </div>
                        :
                        <form class="form-horizontal m-t-20" onsubmit={ctrl.generateTx.bind(ctrl)}>

                            <div class="form-group">
                                <div class="col-xs-12">
                                    <input class="form-control" type="text" required="" name="login"
                                           placeholder={Conf.tr('Login')}
                                    />
                                    <i class="md md-account-circle form-control-feedback l-h-34"></i>
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="col-xs-12">
                                    <input class="form-control" type="password" required="" name="password"
                                           placeholder={Conf.tr('Password')}
                                    />
                                    <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="col-xs-12">
                                    <input class="form-control" type="password" required="" name="repassword"
                                           placeholder={Conf.tr('Repeat password')}
                                    />
                                    <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                                </div>
                            </div>

                            <div class="form-group m-b-0">
                                <div class="col-md-offset-1 col-md-10 text-center">
                                    <button type="submit" class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5 m-r-15">
                                        {Conf.tr('Download for sign')}
                                    </button>
                                    <div class="fileUpload btn btn-inverse btn-custom waves-effect w-md waves-light m-b-5 m-r-0" onchange={ctrl.uploadTx.bind(ctrl)}>
                                        <span>{Conf.tr('Upload signed')}</span><input type="file" accept=".smbx"
                                                                                      id="upload_tx"/>
                                    </div>
                                </div>
                            </div>
                        </form>
                }
            </div>
            {m.component(Footer)}
        </div>
    }
};
