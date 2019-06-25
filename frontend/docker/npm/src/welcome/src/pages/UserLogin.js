var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth.js'),
    Navbar = require('../components/Navbar.js'),
    Footer = require('../components/Footer.js');

var Login = module.exports = {
    controller: function () {
        var ctrl = this;
        if (Auth.enrollment()) {
            return m.route('/user');
        }

        this.login = function (e) {
            e.preventDefault();

            m.onLoadingStart();
            Auth.userLogin(e.target.token.value)
                .then(function () {
                    m.onLoadingEnd();
                    m.route('/user');
                })
                .catch(err => {
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
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
                    <img src="/assets/img/logo.svg" alt="logo"/>
                    <h4>{Conf.tr('Welcome host')}</h4>
                </div>

                <form class="form-horizontal m-t-20" onsubmit={ctrl.login.bind(ctrl)}>

                    <div class="form-group">
                        <div class="col-xs-12">
                            <input class="form-control" type="password" required="required"
                                   placeholder={Conf.tr("Token")}
                                   autocapitalize="none"
                                   name="token"/>
                            <i class="md md-account-circle form-control-feedback l-h-34"></i>
                        </div>
                    </div>

                    <div class="form-group m-t-20 text-center">
                        <button class="btn btn-primary btn-lg btn-custom waves-effect w-md waves-light m-b-5"
                                type="submit">{Conf.tr("Login")}
                        </button>
                    </div>
                </form>
            </div>
            {m.component(Footer)}
        </div>
    }
};
