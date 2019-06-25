var Conf = require('../config/Config.js');

module.exports = {

    controller: function () {},

    view: function (ctrl) {
        return <header id="top-nav">
            <div class="topbar-main">
                <div class="container">
                    <a href="/" config={m.route} class="logo"><svg class="auth-logo-img"></svg></a>
                    <div class="menu-extras">
                        <div class="text-right flags">
                            <a onclick={Conf.loc.changeLocale.bind(ctrl, 'en')} href="#"><img src="/assets/img/flags/en.png" alt="UK"/></a>
                            <a onclick={Conf.loc.changeLocale.bind(ctrl, 'fr')} href="#"><img src="/assets/img/flags/fr.png" alt="FR"/></a>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    }
};
