var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth.js'),
    Footer = require('../components/FooterFullWidth.js');

var Login = module.exports = {
    controller: function () {
        var ctrl = this;

        if (Auth.keypair()) {
            return m.route('/stores');
        }

        this.login = function (e) {
            e.preventDefault();

            m.onLoadingStart();
            Auth.login(e.target.login.value, e.target.password.value)
                .then(function () {
                    m.onLoadingEnd();
                    m.route('/stores');
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(Conf.tr('Login/password combination is invalid'));
                })
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
                    <svg class="auth-logo-img"></svg>
                    <h4>{Conf.tr('Merchant dashboard')}</h4>
                </div>
                <form class="form-horizontal m-t-20" onsubmit={ctrl.login.bind(ctrl)}>
                    <div class="form-group">
                        <div class="col-xs-12">
                            <input class="form-control" type="text" required="required"
                                   placeholder={Conf.tr("Username")}
                                   autocapitalize="none"
                                   name="login"
                            />
                            <i class="md md-account-circle form-control-feedback l-h-34"></i>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-xs-12">
                            <input class="form-control" type="password" required="required" autocapitalize="none"
                                   placeholder={Conf.tr("Password")}
                                   name="password"
                            />
                            <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                        </div>
                    </div>
                    <div class="form-group m-t-20 text-center">
                        <button class="btn btn-primary btn-lg btn-custom waves-effect w-md waves-light m-b-5"
                                type="submit">{Conf.tr("Log in")}
                        </button>
                    </div>
                </form>

                <div class="m-t-10 text-center">
                    <a href="/recovery" config={m.route}>{Conf.tr("Forgot your password?")}</a>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};
