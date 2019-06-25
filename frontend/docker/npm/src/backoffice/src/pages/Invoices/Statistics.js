var Conf        = require('../../config/Config.js'),
    Navbar      = require('../../components/Navbar.js'),
    Footer      = require('../../components/Footer.js'),
    Sidebar     = require('../../components/Sidebar.js'),
    Helpers     = require('../../components/Helpers'),
    Auth        = require('../../models/Auth'),
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
        this.pagination_data = m.prop({module: "Invoices", func: "getStatistics", page: ctrl.page()});

        this.statistics = m.prop([]);

        this.getStatistics = function () {
            m.onLoadingStart();
            Conf.SmartApi.Invoices.getStatistics({limit: ctrl.limit, offset: ctrl.offset})
                .then(function(statistics) {                    
                    if (typeof statistics.data != 'undefined') {
                        m.startComputation();
                        ctrl.statistics(statistics.data);
                        ctrl.is_initialized(true);
                        m.endComputation();
                    } else {
                        console.error('Unexpected response');
                        console.error(statistics);
                        return m.flashError(Conf.tr('Can not get invoices statistics'));
                    }
                })
                .catch(function(error){
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr('Can not get invoices statistics'));
                })
                .then(function(){
                    m.onLoadingEnd();
                });
        };

        this.getStatistics();
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
                                { ctrl.statistics().length ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Invoices statistic')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <table class="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr('Date')}</th>
                                                    <th>{Conf.tr('Created')}</th>
                                                    <th>{Conf.tr('Used')}</th>
                                                    <th>{Conf.tr('Expired')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    ctrl.statistics().map(function (statistic) {
                                                        return <tr>
                                                            <td>{Helpers.getDateOnlyFromTimestamp(statistic.date)}</td>
                                                            <td>{statistic.all}</td>
                                                            <td>{statistic.used}</td>
                                                            <td>{statistic.expired}</td>
                                                        </tr>
                                                    })
                                                }
                                                </tbody>
                                            </table>
                                            {m.component(Pagination, {pagination: ctrl.pagination_data()})}
                                        </div>
                                    </div>
                                    :
                                    <div class="portlet">
                                        <div class="portlet-heading bg-warning">
                                            <h3 class="portlet-title">
                                                {Conf.tr('No invoices statistics found')}
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