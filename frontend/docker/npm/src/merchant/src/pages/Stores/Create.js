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

        this.url  = m.prop('');
        this.name = m.prop('');

        this.clearForm = function () {
            m.startComputation();
            ctrl.url('');
            ctrl.name('');
            m.endComputation();
        };

        this.createStore = function (e) {
            e.preventDefault();

            m.onLoadingStart();

            ctrl.url(e.target.url.value);
            ctrl.name(e.target.name.value);

            var form_data = {
                url    : ctrl.url(),
                name   : ctrl.name(),
            };

            Conf.SmartApi.Merchants.createStore(form_data)
                .then(function(){
                    ctrl.clearForm();
                    return m.flashSuccess(Conf.tr('Store created'));
                })
                .catch(function(error) {
                    console.error(error);
                    return m.flashApiError(error);
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
                                <h3 class="panel-title">{Conf.tr("Create new store")}</h3>
                            </div>
                            <div class="panel-body">
                                <div class="col-lg-6">
                                    <form class="form-horizontal" onsubmit={ctrl.createStore.bind(ctrl)}>
                                        <div class="form-group">
                                            <label for="cmp_code" class="col-md-2 control-label">{Conf.tr("Store url")}</label>
                                            <div class="col-md-4">
                                                <input class="form-control" name="url"
                                                       placeholder={Conf.tr("Store url")}
                                                       type="text" value={ctrl.url()} required="required"/>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="cmp_title" class="col-md-2 control-label">{Conf.tr("Store name")}</label>
                                            <div class="col-md-6">
                                                <input class="form-control" name="name"
                                                       placeholder={Conf.tr("Store name")}
                                                       type="text" value={ctrl.name()} required="required"/>
                                            </div>
                                        </div>
                                        <div class="form-group m-b-0">
                                            <div class="col-sm-offset-2 col-sm-9">
                                                <button type="submit" class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr('Create')}</button>
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