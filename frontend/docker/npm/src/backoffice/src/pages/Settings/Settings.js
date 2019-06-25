var Conf = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth = require('../../models/Auth.js');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.changePassword = function (e) {
            e.preventDefault();

            if (!e.target.oldpassword.value || !e.target.password.value || !e.target.repassword.value) {
                return m.flashError(Conf.tr("Please, fill all required fields"));
            }

            if (e.target.password.value.length < 6) {
                return m.flashError(Conf.tr("Password should have 6 chars min"));
            }

            if (e.target.password.value != e.target.repassword.value) {
                return m.flashError(Conf.tr("Passwords should match"));
            }

            if (e.target.oldpassword.value == e.target.password.value) {
                return m.flashError(Conf.tr("New password cannot be same as old"));
            }

            m.onLoadingStart();

            Auth.updatePassword(e.target.oldpassword.value, e.target.password.value)
                .then(function () {
                    m.startComputation();
                    e.target.reset();
                    m.endComputation();
                    return m.flashSuccess(Conf.tr("Password changed"));
                })
                .catch(function (err) {
                    console.error(err);
                    m.flashError(Conf.tr("Cannot change password"));
                })
                .then(function () {
                    return m.onLoadingEnd();
                })
        };

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="panel panel-color panel-primary">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr("Change password")}</h3>
                                    </div>
                                    <div class="panel-body">
                                        <form class="form-horizontal" onsubmit={ctrl.changePassword.bind(ctrl)}>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Old password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="oldpassword"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("New password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="password"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Repeat new password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="repassword"/>
                                                </div>
                                            </div>
                                            <div class="form-group m-t-20">
                                                <div class="col-sm-7">
                                                    <button class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                            type="submit">
                                                        {Conf.tr("Change")}
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
            </div>
            {m.component(Footer)}
        </div>
    }
};
