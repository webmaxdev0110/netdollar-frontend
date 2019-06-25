var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Helpers = require('../../models/Helpers'),
    Session = require('../../models/Session.js'),
    Pagination  = require('../../components/Pagination.js'),
    Auth    = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.store_id  = m.prop(m.route.param("store_id"));
        if (!ctrl.store_id()) {
            return m.route('/stores');
        }

        this.is_initialized = m.prop(false);
        this.page = (m.route.param('page')) ? m.prop(Number(m.route.param('page'))) : m.prop(1);
        this.limit = Conf.pagination.limit;
        this.offset = (ctrl.page() - 1) * ctrl.limit;
        this.pagination_data = m.prop({module: "Merchants", func: "getStoreOrders", page: ctrl.page(), params: {store_id: ctrl.store_id()}});

        this.orders = m.prop([]);

        m.onLoadingStart();
        Conf.SmartApi.Merchants.getStoreOrders({store_id: ctrl.store_id(), limit: ctrl.limit, offset: ctrl.offset})
            .then(function(orders){
                if (typeof orders.data != 'undefined') {
                    m.startComputation();
                    ctrl.orders(orders.data);
                    ctrl.is_initialized(true);
                    m.endComputation();
                } else {
                    console.error('Unexpected response');
                    console.error(orders);
                }
            })
            .catch(function(error) {
                console.error(error);
                return m.flashApiError(error);
            })
            .then(function() {
                m.onLoadingEnd();
            });

        this.showErrorDetails = function (error_details, e){
            m.startComputation();
            Session.modal(
                <table class="table">
                    <tr>
                        <td><code>{error_details}</code></td>
                    </tr>
                </table>
                , Conf.tr("Error details"));
            m.endComputation();
        };

        this.showPaymentDetails = function (payment_details, e) {

            m.startComputation();
            Session.modal(
                <table class="table">
                    <tr>
                        <td>{Conf.tr('Payment date')}:</td>
                        <td><code>{Helpers.getDateFromTimestamp(payment_details.date || false)}</code></td>
                    </tr>
                    <tr>
                        <td>{Conf.tr('Payment amount')}:</td>
                        <td><code>{parseFloat(payment_details.amount).toFixed(2)}</code></td>
                    </tr>
                    <tr>
                        <td>{Conf.tr('Payer')}:</td>
                        <td><code>{payment_details.payer}</code></td>
                    </tr>
                    <tr>
                        <td>{Conf.tr('Payment details')}:</td>
                        <td><code>{payment_details.details}</code></td>
                    </tr>
                    <tr>
                        <td>{Conf.tr('Transaction ID')}:</td>
                        <td><code>{payment_details.tx}</code></td>
                    </tr>
                </table>
                , Conf.tr("Payment details"));
            m.endComputation();
        };

        this.textStatus = function (status_id) {
            switch(status_id) {
                case Conf.statuses.STATUS_WAIT_PAYMENT:
                    return <label class="label label-primary">{Conf.tr('Wait payment')}</label>;
                    break;
                case Conf.statuses.STATUS_WAIT_ANSWER:
                    return <label class="label label-info">{Conf.tr('Wait answer')}</label>;
                    break;
                case Conf.statuses.STATUS_PARTIAL_PAYMENT:
                    return <label class="label label-warning">{Conf.tr('Partial payment')}</label>;
                    break;
                case Conf.statuses.STATUS_FAIL:
                    return <label class="label label-danger">{Conf.tr('Fail')}</label>;
                    break;
                case Conf.statuses.STATUS_SUCCESS:
                    return <label class="label label-success">{Conf.tr('Success')}</label>;
                    break;
            }
        }

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
                                {(ctrl.orders().length) ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Orders')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <table class="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr('ID')}</th>
                                                    <th>{Conf.tr('Order date')}</th>
                                                    <th>{Conf.tr('Order amount')}</th>
                                                    <th>{Conf.tr('Currency')}</th>
                                                    <th>{Conf.tr('Store order id')}</th>
                                                    <th>{Conf.tr('Status')}</th>
                                                    <th>{Conf.tr('Payment details')}</th>
                                                    <th>{Conf.tr('Error details')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {ctrl.orders().map(function (order) {
                                                    return <tr>
                                                        <td>
                                                            <span title={Conf.tr("ID")}>{order.id}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Order date")}>{Helpers.getDateFromTimestamp(order.created)}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Order amount")}>{parseFloat(order.amount).toFixed(2)}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Order currency")}>{order.currency}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("ID on merchant store")}>{order.external_order_id}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Status")}>{ctrl.textStatus(order.status)}</span>
                                                        </td>
                                                        <td>
                                                            {
                                                                order.tx ?
                                                                    <button
                                                                        class="btn-xs btn-primary waves-effect waves-light"
                                                                        onclick={ctrl.showPaymentDetails.bind(ctrl,
                                                                            {
                                                                                date:       order.payment_date,
                                                                                amount:     order.payment_amount,
                                                                                payer:      order.payer,
                                                                                tx:         order.tx,
                                                                                details:    order.details,
                                                                            }
                                                                        )}
                                                                    >{Conf.tr('Show keys')}</button>
                                                                    :
                                                                    '-'
                                                            }
                                                        </td>
                                                        <td>
                                                            {
                                                                order.error_details ?
                                                                    <button
                                                                        class="btn-xs btn-danger waves-effect waves-light"
                                                                        onclick={ctrl.showErrorDetails.bind(ctrl, order.error_details)}
                                                                    >{Conf.tr('Show keys')}</button>
                                                                    :
                                                                    '-'
                                                            }
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
                                                {Conf.tr('No orders found')}
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