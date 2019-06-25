var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var Footer = require('../components/FooterFullWidth');

var Recovery = module.exports = {
    controller: function () {
        var ctrl = this;
        this.wordNum = m.prop(1);

        if (Auth.keypair()) {
            return m.route('/home');
        }

        this.login = function (e) {
            e.preventDefault();

            m.onLoadingStart();
            Auth.mnemonicLogin(e.target.mnemonic.value)
                .then(function () {
                    m.onLoadingEnd();
                    m.route('/home');
                    return true;
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(Conf.tr('Login/password combination is invalid'));
                })
        };

        this.phraseEdit = function (value) {
            var words = value.split(' ');
            if (words.length < Conf.mnemonic.totalWordsCount) {
                ctrl.wordNum(words.length);
            } else {
                ctrl.wordNum(Conf.mnemonic.totalWordsCount)
            }
        };
    },

    view: function (ctrl) {
        return <div>
            <ul class="nav navbar-nav navbar-right pull-right hidden-xs lang-switcher">
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <img src={"/assets/img/flags/" + Conf.current_language + ".png"} alt=""/>
                        &nbsp;
                        <i class="fa fa-caret-down"></i>
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
                <div className="auth-form">
                    <div class="text-center">
                        <h3>{Conf.tr("Log in via mnemonic phrase")}</h3>
                    </div>
                    <form class="form-horizontal m-t-20" onsubmit={ctrl.login.bind(ctrl)}>
                        <div id="by-mnemonic" class="tab-pane">
                            <div class="form-group">
                                <div class="col-xs-12">
                                    <label class="control-label text-right">
                                        {Conf.tr("Enter your mnemonic phrase word number $[1] of $[2]", ctrl.wordNum(), Conf.mnemonic.totalWordsCount)}
                                    </label>
                                </div>
                                <div class="col-xs-12">
                                    <textarea class="form-control mnemonic-field" required="required"
                                              placeholder={Conf.tr("Mnemonic phrase")}
                                              autocapitalize="none"
                                              name="mnemonic"
                                              oninput={m.withAttr("value", ctrl.phraseEdit.bind(ctrl))}
                                    />
                                    <i class="md md-spellcheck form-control-feedback l-h-34"></i>
                                </div>
                            </div>
                        </div>
                        <div class="form-group m-t-20 text-center">
                            <button
                                class="btn btn-success btn-lg btn-custom waves-effect w-md waves-light m-b-5"
                                type="submit">{Conf.tr("Log in")}
                            </button>
                        </div>
                    </form>
                    <div class="m-t-10 text-center">
                        <a href="/" config={m.route}>{Conf.tr("Back")}</a>
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};
