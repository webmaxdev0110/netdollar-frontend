var Conf    = require('../../config/Config.js'),
    Navbar  = require('../../components/Navbar.js'),
    Footer  = require('../../components/Footer.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Helpers = require('../../models/Helpers'),
    Auth    = require('../../models/Auth'),
    Session = require('../../models/Session.js'),
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
        this.pagination_data = m.prop({module: "Merchants", func: "getStores", page: ctrl.page()});

        this.stores     = m.prop([]);
        this.store_id   = m.prop(false);
        this.secret_key = m.prop(false);

        m.onLoadingStart();
        Conf.SmartApi.Merchants.getStores({limit: ctrl.limit, offset: ctrl.offset})
            .then(function(stores){
                if (typeof stores.data != 'undefined') {
                    m.startComputation();
                    ctrl.stores(stores.data);
                    ctrl.is_initialized(true);
                    m.endComputation();
                } else {
                    console.error('Unexpected response');
                    console.error(stores);
                }
            })
            .catch(function(error) {
                console.error(error);
                return m.flashApiError(error);
            })
            .then(function() {
                m.onLoadingEnd();
            });

        this.showKeys = function (store_id, secret_key, e){
            ctrl.store_id(store_id);
            ctrl.secret_key(secret_key);

            m.startComputation();
            Session.modal(
                <table class="table">
                    <tr>
                        <td>{Conf.tr('Store ID')}:</td>
                        <td><code>{ctrl.store_id()}</code></td>
                    </tr>
                    <tr>
                        <td>{Conf.tr('Secret key')}:</td>
                        <td><code>{ctrl.secret_key()}</code></td>
                    </tr>
                </table>
                , Conf.tr("Data"));
            m.endComputation();
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
                                {(ctrl.stores().length) ?
                                    <div class="panel panel-color panel-primary">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr('Registered stores')}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <table class="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr('URL')}</th>
                                                    <th>{Conf.tr('Title')}</th>
                                                    <th>{Conf.tr('Created')}</th>
                                                    <th>{Conf.tr('Data')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {ctrl.stores().map(function (store) {
                                                    return <tr>
                                                        <td>
                                                            <span title={Conf.tr("URL")}>{store.url}</span>
                                                        </td>
                                                        <td>
                                                            <span title={Conf.tr("Title")}>{store.name}</span>
                                                        </td>
                                                        <td>
                                                            <span>{Helpers.getDateFromTimestamp(store.created)}</span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                class="btn-xs btn-warning waves-effect waves-light m-r-10"
                                                                onclick={ctrl.showKeys.bind(ctrl, store.store_id, store.secret_key)}
                                                            >{Conf.tr('Show keys')}</button>
                                                            <a
                                                                class="btn-xs btn-primary waves-effect waves-light"
                                                                href={"/orders/" + store.store_id} config={m.route}
                                                            >
                                                                {Conf.tr('Show orders')}
                                                            </a>
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
                                                {Conf.tr('No stores found')}
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
                                                {Conf.tr('Please')}<a href='/stores/create' config={m.route}> {Conf.tr("create")}</a>!
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