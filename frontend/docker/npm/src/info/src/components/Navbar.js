var Conf = require('../config/Config.js');

module.exports = {

    controller: function () {
        var ctrl = this;
    },

    view: function (ctrl) {
        return 	<header id="topnav">
                <div class="topbar-main m-b-20">
                    <div class="container">
                        <div class="logo m-b-20">
                            <a href="/" class="logo"><i class="md md-equalizer"></i> <span>{Conf.project_name} Ledger Viewer</span> </a>
                        </div>
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
                    </div>
                </div>
            </header>
    }
};
