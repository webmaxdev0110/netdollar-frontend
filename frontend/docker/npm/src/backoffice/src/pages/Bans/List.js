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
        this.pagination_data = m.prop({module: "Bans", func: "getList", page: ctrl.page()});
        this.list = m.prop([]);

        this.getBansList = function () {
            m.onLoadingStart();
            Conf.SmartApi.Bans.getList({limit: ctrl.limit, offset: ctrl.offset})
                .then(function(list) {
                    if (typeof list.data != 'undefined') {
                        m.startComputation();
                        ctrl.list(list.data);
                        ctrl.is_initialized(true);
                        m.endComputation();
                    } else {
                        console.error('Unexpected response');
                        console.error(list);
                    }
                })
                .catch(function(error){
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not get companies list"));
                })
                .then(function(){
                    m.onLoadingEnd();
                });
        };

        this.getBansList();

        this.deleteBan = function (ip) {
            swal({
                title: Conf.tr("Delete ban") + '?',
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: Conf.tr("Yes, delete it"),
                cancelButtonText: Conf.tr("Cancel"),
            })
            .then(function () {
                return Conf.SmartApi.Bans.delete({ip: String(ip)})
                    .then(function(){
                        m.flashSuccess(Conf.tr('IP unbanned'));
                    })
                    .then(function(){
                        return ctrl.getBansList();
                    })
                    .catch(function(error) {
                        console.log(error);
                        m.flashError(Conf.tr(error.message || Conf.errors.service_error));
                    });
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
                        {(ctrl.is_initialized()) ?
                            <div>
                                { ctrl.list().length ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Ip ban list and bad requests statistic')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <table class="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr('Ip')}</th>
                                                    <th>{Conf.tr('Banned to')}</th>
                                                    <th>{Conf.tr("Unban")}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    ctrl.list().map(function (statistic) {
                                                        return <tr>
                                                            <td>{Helpers.long2ip(statistic.ip)}</td>
                                                            <td>{Helpers.getDateFromTimestamp(statistic.banned_to)}</td>
                                                            <td class="col-sm-1">
                                                            <button
                                                               class="btn btn-danger btn-custom waves-effect w-md waves-light m-b-5"
                                                               onclick={ctrl.deleteBan.bind(ctrl, Helpers.long2ip(statistic.ip))}
                                                            >{Conf.tr('Remove')}</button>
                                                            </td>
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
                                                {Conf.tr('Bans not found')}
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
