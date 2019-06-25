var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth'),
    Helpers = require('../models/Helpers');

module.exports = {

    controller: function () {
        var ctrl = this;

        this.refreshPage = function () {
            m.route(m.route());
        };
    },

    view: function (ctrl) {
        return <div class="topbar">
            <div class="topbar-left">
                <div class="text-center">
                    <a href="/home" config={m.route} class="logo"><svg class="logo-img"></svg></a>
                </div>
            </div>

            <div class="navbar navbar-default" role="navigation">
                <div class="container">
                    <div class="">
                        <div class="pull-left">
                            <button class="button-menu-mobile open-left waves-effect">
                                <i class="md md-menu"></i>
                            </button>
                            <span class="clearfix"></span>
                        </div>
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li>
                                <a href="#" onclick={Auth.logout}>
                                    <span class="fa fa-power-off align-middle m-r-5 f-s-20"></span>
                                    <span class="align-middle">{Conf.tr("Logout")}</span>
                                </a>
                            </li>
                        </ul>
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li class="dropdown">
                                <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                                    <span class="fa fa-language align-middle m-r-5 f-s-20"></span>
                                    <span class="align-middle">{Conf.current_language}</span>
                                    &nbsp;
                                    <span class="fa fa-caret-down align-middle f-s-20"></span>
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
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li>
                                <a
                                    href="#"
                                    onclick={function(){return Conf.SmartApi.Api.refreshNonce()}}
                                    title={Conf.tr('Time before the session close. Click to update session.')}
                                >
                                    <span class="fa fa-clock-o m-r-5 align-middle f-s-20"></span>
                                    <span class="align-middle" id="spinner-time">
                                            {
                                                !Auth.ttl() ?
                                                    ''
                                                    :
                                                    Helpers.getTimeFromSeconds(Auth.ttl())
                                            }
                                            </span>
                                </a>
                            </li>
                        </ul>
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li>
                                <a
                                    href="#"
                                    onclick={ctrl.refreshPage.bind(ctrl)}
                                    title={Conf.tr('Click for update page.')}
                                >
                                    <span class="fa fa-refresh align-middle f-s-20"></span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    }
};
