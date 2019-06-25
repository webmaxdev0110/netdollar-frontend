var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Helpers = require('../../components/Helpers'),
    Auth    = require('../../models/Auth'),
    Pagination  = require('../../components/Pagination.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.is_initialized = m.prop(false);

        this.page = (m.route.param('page')) ? m.prop(Number(m.route.param('page'))) : m.prop(1);
        this.limit = Conf.pagination.limit;
        this.offset = (ctrl.page() - 1) * ctrl.limit;
        this.pagination_data = m.prop({module: "Companies", func: "getList", page: ctrl.page()});

        this.companies = m.prop([]);

        m.onLoadingStart();
        Conf.SmartApi.Companies.getList({limit: ctrl.limit, offset: ctrl.offset})
            .then(function(companies){
                if (typeof companies.data != 'undefined') {
                    m.startComputation();
                    ctrl.companies(companies.data);
                    ctrl.is_initialized(true);
                    m.endComputation();
                } else {
                    console.error('Unexpected response');
                    console.error(companies);
                    return m.flashError(Conf.tr('Can not load companies'))
                }
            })
            .catch(function(error) {
                console.error(error);
                if (error.name === 'ApiError') {
                    return m.flashApiError(error);
                }

                return m.flashError(Conf.tr("Can not get companies list"));
            })
            .then(function() {
                m.onLoadingEnd();
            });

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {(ctrl.is_initialized()) ?
                            <div>
                                {
                                    ctrl.companies().length ?
                                        <div class="panel panel-color panel-primary">
                                            <div class="panel-heading">
                                                <h3 class="panel-title">{Conf.tr('Registered companies')}</h3>
                                            </div>
                                            <div class="panel-body">
                                                <table class="table table-bordered">
                                                    <thead>
                                                    <tr>
                                                        <th>{Conf.tr('Created')}</th>
                                                        <th>{Conf.tr('Code')}</th>
                                                        <th>{Conf.tr('Title')}</th>
                                                        <th>{Conf.tr('Address')}</th>
                                                        <th>{Conf.tr('Phone')}</th>
                                                        <th>{Conf.tr('Email')}</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {ctrl.companies().map(function (company) {
                                                        return <tr>
                                                            <td>
                                                                <span title={Conf.tr("Created")}>{Helpers.getDateFromTimestamp(company.created_date)}</span>
                                                            </td>
                                                            <td>
                                                                <span title={Conf.tr("Code")}>{company.code}</span>
                                                            </td>
                                                            <td>
                                                                <span title={Conf.tr("Title")}>{company.title}</span>
                                                            </td>
                                                            <td>
                                                                <span title={Conf.tr("Address")}>{company.address}</span>
                                                            </td>
                                                            <td>
                                                                <span title={Conf.tr("Phone")}>{company.phone}</span>
                                                            </td>
                                                            <td>
                                                                <span title={Conf.tr("Email")}>{company.email}</span>
                                                            </td>
                                                        </tr>
                                                    })}
                                                    </tbody>
                                                </table>
                                                {m.component(Pagination, {pagination: ctrl.pagination_data()})}
                                            </div>
                                        </div>
                                        :
                                        <div class="portlet">
                                            <div class="portlet-heading bg-warning">
                                                <h3 class="portlet-title">
                                                    {Conf.tr('No companies found')}
                                                </h3>
                                                <div class="portlet-widgets">
                                                    <a data-toggle="collapse" data-parent="#accordion1" href="#bg-warning">
                                                        <i class="ion-minus-round"></i>
                                                    </a>
                                                    <span class="divider"></span>
                                                    <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                                </div>
                                                <div class="clearfix"></div>
                                            </div>
                                            <div id="bg-warning" class="panel-collapse collapse in">
                                                <div class="portlet-body">
                                                    {Conf.tr('Please')}<a href='/companies/create' config={m.route}> {Conf.tr("create")}</a>!
                                                </div>
                                            </div>
                                        </div>
                                }
                            </div>
                            :
                            <div class="portlet">
                                <div class="portlet-heading bg-primary">
                                    <h3 class="portlet-title">
                                        {Conf.tr('Wait for data loading')}...
                                    </h3>
                                    <div class="portlet-widgets">
                                        <a data-toggle="collapse" data-parent="#accordion1" href="#bg-warning">
                                            <i class="ion-minus-round"></i>
                                        </a>
                                        <span class="divider"></span>
                                        <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                    </div>
                                    <div class="clearfix"></div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};