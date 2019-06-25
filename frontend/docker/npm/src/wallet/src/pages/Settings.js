var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var ProgressBar = require('../components/ProgressBar');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }
        Conf.SmartApi.Api.refreshNonce();

        this.progress = m.prop(0);
        this.showProgress = m.prop(false);

        Auth.setListener(function (progress) {
            ctrl.progress(progress);
        });

        this.onunload = function() {
            Auth.removeListener();
        };

        this.email = m.prop(Auth.wallet().email || '');

        this.changePassword = function (e) {
            e.preventDefault();

            let pass = e.target.password.value;
            let oldPass = e.target.oldpassword.value;
            let rePass = e.target.repassword.value;

            if (!oldPass || !pass || !rePass) {
                return m.flashError(Conf.tr("Please, fill all required fields"));
            }

            if (pass.length < 8) {
                return m.flashError(Conf.tr("Password should have 8 chars min"));
            }

            if (pass != rePass) {
                return m.flashError(Conf.tr("Passwords should match"));
            }

            if (oldPass == pass) {
                return m.flashError(Conf.tr("New password cannot be same as old"));
            }

            let regex = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{1,}$/;
            if (!regex.test(pass)) {
                return m.flashError(Conf.tr("Password must contain at least one upper case letter, one lower case letter and one digit"));
            }

            m.onLoadingStart();
            m.startComputation();
            ctrl.showProgress(true);
            m.endComputation();
            Conf.SmartApi.Api.refreshNonce();

            Auth.updatePassword(oldPass, pass)
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
                    m.startComputation();
                    ctrl.showProgress(false);
                    ctrl.progress(0);
                    m.endComputation();
                    return m.onLoadingEnd();
                })
        };

        this.bindData = function (e) {
            e.preventDefault();

            if (e.target.email.value != Auth.wallet().email) {

                m.onLoadingStart();

                var dataToUpdate = {};
                if (e.target.email.value) {
                    //validate email
                    var email_re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    if (!email_re.test(e.target.email.value)) {
                        return m.flashError(Conf.tr("Invalid email"));
                    }
                }
                dataToUpdate.email = e.target.email.value;

                Conf.SmartApi.Api.refreshNonce();

                Auth.update(dataToUpdate)
                    .then(function () {
                        m.flashSuccess(Conf.tr("Profile saved"));
                    })
                    .catch(function (error) {
                        console.error(error);
                        if (error.name === 'ApiError') {
                            return m.flashApiError(error);
                        }

                        return m.flashError(Conf.tr("Cannot update profile details"));
                    })
                    .then(function () {
                        m.startComputation();
                        ctrl.email = m.prop(Auth.wallet().email || '');
                        m.endComputation();
                        return m.onLoadingEnd();
                    })
            }
        }
    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    {ctrl.showProgress() ?
                        <div class="form-group m-t-20">
                            {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Decrypting your old password and encrypting your new password")})}
                        </div>
                        :
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
                            <div class="col-lg-6">
                                <div class="panel panel-color panel-primary">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr("Change account info")}</h3>
                                    </div>
                                    <div class="panel-body">
                                        <form class="form-horizontal" onsubmit={ctrl.bindData.bind(ctrl)}>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Email")}:</label>
                                                    <input class="form-control" type="text" name="email"
                                                           oninput={m.withAttr("value", ctrl.email)} value={ctrl.email()}/>
                                                </div>
                                            </div>
                                            {
                                                ctrl.email() != Auth.wallet().email ?
                                                    <div class="form-group m-t-20">
                                                        <div class="col-sm-7">
                                                            <button
                                                                class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                                type="submit">{Conf.tr("Save")}</button>
                                                        </div>
                                                    </div>
                                                    :
                                                    ''
                                            }
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>

        ];
    }
};
