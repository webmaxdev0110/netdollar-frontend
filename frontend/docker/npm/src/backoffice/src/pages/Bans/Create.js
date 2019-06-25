var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.ip = m.prop('');
        this.ttl = m.prop('');

        this.clearForm = function () {
            m.startComputation();
            ctrl.ip('');
            ctrl.ttl('');
            m.endComputation();
        };

        this.addBan = function (e) {
            e.preventDefault();
            m.onLoadingStart();

            ctrl.ip(String(e.target.ip.value));
            ctrl.ttl(Number(e.target.ttl.value));

            Conf.SmartApi.Bans.create({
                    ip: ctrl.ip(),
                    ttl: ctrl.ttl()
                })
                .then(function () {
                    ctrl.clearForm();
                    m.flashSuccess(Conf.tr('IP banned'));
                })
                .catch(function (error) {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not ban ip"));
                });
        }
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="panel panel-primary panel-border">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Add ip to banlist")}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="col-lg-6">
                                    <form class="form-horizontal" onsubmit={ctrl.addBan.bind(ctrl)}>
                                        <div class="form-group">
                                            <label for="ip" class="col-md-4 control-label">{Conf.tr("Ip")}</label>
                                            <div class="col-md-8">
                                                <input class="form-control"
                                                       name="ip"
                                                       id="ip"
                                                       placeholder={Conf.tr("User ip")}
                                                       type="text"
                                                       value=""
                                                       required="required"/>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="ttl"
                                                   class="col-md-4 control-label">{Conf.tr("Time of ban (in seconds)")}</label>
                                            <div class="col-md-8">
                                                <input class="form-control"
                                                       name="ttl"
                                                       id="ttl"
                                                       placeholder={Conf.tr("Time of ban")}
                                                       type="number"
                                                       value=""
                                                       required="required"/>
                                            </div>
                                        </div>
                                        <div class="form-group m-b-0">
                                            <div class="col-sm-offset-4 col-sm-4">
                                                <button type="submit"
                                                        class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">
                                                    {Conf.tr('Add')}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};