var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Auth    = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.cmp_code       = m.prop('');
        this.cmp_title      = m.prop('');
        this.cmp_address    = m.prop('');
        this.cmp_phone      = m.prop('');
        this.cmp_email      = m.prop('');

        this.clearForm = function () {
            m.startComputation();
            ctrl.cmp_code('');
            ctrl.cmp_title('');
            ctrl.cmp_address('');
            ctrl.cmp_phone('');
            ctrl.cmp_email('');
            m.endComputation();
        };

        this.createCompany = function (e) {
            e.preventDefault();

            m.onLoadingStart();

            ctrl.cmp_code(e.target.code.value);
            ctrl.cmp_title(e.target.title.value);
            ctrl.cmp_address(e.target.address.value);
            ctrl.cmp_phone(e.target.phone.value);
            ctrl.cmp_email(e.target.email.value);

            var form_data = {
                code    : ctrl.cmp_code(),
                title   : ctrl.cmp_title(),
                address : ctrl.cmp_address(),
                phone   : ctrl.cmp_phone(),
                email   : ctrl.cmp_email()
            };

            Conf.SmartApi.Companies.create(form_data)
                .then(function(){
                    ctrl.clearForm();
                    m.flashSuccess(Conf.tr('Company created'));
                })
                .catch(function(error) {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not create company"));
                });
        };
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
                                <h3 class="panel-title">{Conf.tr("Create new company")}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="col-lg-6">
                                    <form class="form-horizontal" onsubmit={ctrl.createCompany.bind(ctrl)}>
                                        <div class="form-group">
                                            <label for="cmp_code" class="col-md-2 control-label">{Conf.tr("Code")}</label>
                                            <div class="col-md-4">
                                                <input class="form-control" name="code" id="cmp_code"
                                                       placeholder={Conf.tr("Registration Code")}
                                                       type="text" value={ctrl.cmp_code()} required="required"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label for="cmp_title" class="col-md-2 control-label">{Conf.tr("Title")}</label>
                                            <div class="col-md-6">
                                                <input class="form-control" name="title" id="cmp_title"
                                                       placeholder={Conf.tr("Registration Title")}
                                                       type="text" value={ctrl.cmp_title()} required="required"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label for="cmp_address" class="col-md-2 control-label">{Conf.tr("Address")}</label>
                                            <div class="col-md-6">
                                                <input class="form-control" name="address" id="cmp_address"
                                                       placeholder={Conf.tr("Registration address")}
                                                       type="text" value={ctrl.cmp_address()} required="required"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label for="cmp_phone" class="col-md-2 control-label">{Conf.tr("Phone")}</label>
                                            <div class="col-md-6">
                                                <input class="form-control" name="phone" id="cmp_phone"
                                                       placeholder={Conf.tr("Registration phone number")}
                                                       type="text" value={ctrl.cmp_phone()} required="required"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label for="cmp_email" class="col-md-2 control-label">{Conf.tr("Email")}</label>
                                            <div class="col-md-6">
                                                <input class="form-control" name="email" id="cmp_email"
                                                       placeholder={Conf.tr("Contact email")}
                                                       type="text" value={ctrl.cmp_email()} required="required"/>
                                            </div>
                                        </div>

                                        <div class="form-group m-b-0">
                                            <div class="col-sm-offset-2 col-sm-9">
                                                <button type="submit" class="btn btn-primary btn-custom waves-effect w-md waves-light">{Conf.tr('Add')}</button>
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