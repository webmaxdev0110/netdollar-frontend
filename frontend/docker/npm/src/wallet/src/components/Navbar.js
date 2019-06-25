var Auth = require('../models/Auth.js'),
    Conf = require('../config/Config.js'),
    Helpers = require('../components/Helpers');

module.exports = {

    controller: function () {
        var ctrl = this;

        this.visible = m.prop(false);

        this.toggleVisible = function () {
            this.visible(!this.visible());
            Conf.SmartApi.Api.refreshNonce();

            if (this.visible()) {
                $('#mobile-spec-menu').css('max-height', $(window).height() - $('.topbar-main').height());
            }
        };

        this.refreshPage = function () {
            Conf.SmartApi.Api.refreshNonce();
            m.route(m.route());
        };

    },

    view: function (ctrl) {
        return <header id="topnav">
            <div class="topbar-main">
                <div class="container">

                    <a href="/" config={m.route} class="logo"><svg class="logo-img"></svg></a>

                    <div class="menu-extras">
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
                                        <a onclick={Conf.loc.changeLocale.bind(ctrl, 'fr')} href="#"><img
                                            src="/assets/img/flags/fr.png"/> français</a>
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
                                    <span class="align-middle" id="spinner-time"></span>
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
                        <div class="menu-item">
                            <a onclick={ctrl.toggleVisible.bind(ctrl)}
                               class={ctrl.visible() ? 'open navbar-toggle' : 'navbar-toggle'}>
                                <div class="lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>


            <div class="navbar-custom">
                <div class="container">
                    <div id="navigation" style={ctrl.visible()? 'display:block;' : ''}>
                        <ul class="navigation-menu" id="mobile-spec-menu">
                            <li>
                                <a href="/" config={m.route}><i class="md md-dashboard"></i>{Conf.tr("Dashboard")}</a>
                            </li>
                            <li>
                                <a href="/payments" config={m.route}><i class="md md-list"></i>{Conf.tr("Payments")}</a>
                            </li>
                            <li>
                                <a href="/transfer" config={m.route}><i
                                    class="fa fa-money"></i>{Conf.tr("Transfer money")}</a>
                            </li>

                            <li>
                                <a href="/invoice" config={m.route}><i
                                    class="md md-payment"></i>{Conf.tr("Create invoice")}</a>
                            </li>
                            {(Auth.username()) ?
                                <li>
                                    <a href="/settings" config={m.route}><i class="md md-settings"></i>{Conf.tr("Settings")}
                                    </a>
                                </li>
                            : ''}
                            <li class="visible-xs">
                                <a href="#" onclick={Auth.logout}><i class="fa fa-power-off m-r-5"></i>
                                    {Conf.tr("Logout")}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    }
};