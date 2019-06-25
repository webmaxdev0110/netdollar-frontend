var Conf = require('../config/Config.js'),
    Auth = require('../models/Auth');


module.exports = {

    controller: function () {
        var ctrl = this;
    },

    view: function (ctrl) {
        return <div class="topbar">
            <div class="topbar-left">
                <div class="text-center">
                    <a href="/" class="logo"><i class="md md-equalizer"></i> <span>{Conf.project_name}</span> </a>
                </div>
            </div>

            <div class="navbar navbar-default" role="navigation">
                <div class="container">
                    <div class="">
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li>
                                <a href="#" onclick={Auth.logout}><i class="fa fa-power-off m-r-5"></i>
                                    {Conf.tr("Logout")}
                                </a>
                            </li>
                        </ul>

                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li class="dropdown">
                                <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                                    <i class="fa fa-language fa-fw"></i> <i class="fa fa-caret-down"></i>
                                </a>
                                <ul class="dropdown-menu dropdown-user">
                                    <li>
                                        <a onclick={Conf.loc.changeLocale.bind(ctrl, 'en')} href="#"><img src="/assets/img/flags/en.png" /> English</a>
                                        <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ua')} href="#"><img src="/assets/img/flags/ua.png" /> Українська</a>
                                        <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ru')} href="#"><img src="/assets/img/flags/ru.png" /> Русский</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>

                    </div>
                </div>
            </div>
        </div>
    }
};
