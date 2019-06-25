var Conf = require('../../config/Config.js');
var Wrapper = require('../../components/Wrapper.js');
var Auth = require('../../models/Auth.js');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        //return phone in pattern or prefix
        this.getPhoneWithViewPattern = function (number) {
            if (!number.length || number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.addPhoneViewPattern = function (e) {
            ctrl.phone = ctrl.getPhoneWithViewPattern(e.target.value);
        };

        this.onBlur = function (e) {
            var phone = e.target.value;
            if (!e.target.value || e.target.value == Conf.phone.prefix || e.target.value.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                phone = '';
            }
            this.phone = m.prop(VMasker.toPattern(phone, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.phone = Auth.wallet().phone ? ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.wallet().phone) : m.prop('');
        this.email = m.prop(Auth.wallet().email || '');

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

        this.bindData = function (e) {
            e.preventDefault();

            //reformat phone to database format
            e.target.phone.value = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask);
            var phone_number = e.target.phone.value.substr(2) ? e.target.phone.value.substr(2) : '';

            if (e.target.email.value != Auth.wallet().email || phone_number != Auth.wallet().phone) {

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
                if (phone_number) {
                    //validate phone
                    if (phone_number.length > 0 && phone_number.match(/\d/g).length != Conf.phone.length) {
                        m.startComputation();
                        ctrl.phone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix + phone_number);
                        m.endComputation();
                        return m.flashError(Conf.tr("Invalid phone"));
                    }
                }
                dataToUpdate.phone = phone_number;

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
                        ctrl.phone = Auth.wallet().phone ? ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.wallet().phone) : m.prop('');
                        ctrl.email = m.prop(Auth.wallet().email || '');
                        m.endComputation();
                        return m.onLoadingEnd();
                    })
            }
        }
    },

    view: function (ctrl) {
        return m.component(Wrapper, {
            title: Conf.tr("Settings"),
            tpl: <div class="wrapper">
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

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("Phone")}:</label>
                                                <input class="form-control" type="text" name="phone"
                                                       placeholder={Conf.phone.view_mask}
                                                       oninput={ctrl.addPhoneViewPattern.bind(ctrl)}
                                                       onfocus={ctrl.addPhoneViewPattern.bind(ctrl)}
                                                       onblur={ctrl.onBlur.bind(ctrl)}
                                                       value={ctrl.phone()}/>
                                            </div>
                                        </div>
                                        {

                                            ctrl.phone() != Auth.wallet().phone || ctrl.email() != Auth.wallet().email ?
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
                </div>
            </div>
        });
    }
};
