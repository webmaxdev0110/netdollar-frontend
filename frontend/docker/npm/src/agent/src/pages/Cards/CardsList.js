var Conf = require('../../config/Config.js');
var Wrapper = require('../../components/Wrapper.js');
var Helpers = require('../../components/Helpers.js');
var Auth = require('../../models/Auth.js');
var Pagination = require('../../components/Pagination.js');
var Session = require('../../models/Session.js');

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
        this.pagination_data = m.prop({module: "Cards", func: "getList", page: ctrl.page()});

        this.cardsList = m.prop([]);

        this.getCardsList = function () {
            m.onLoadingStart();

            return Conf.SmartApi.Cards.getList({limit: ctrl.limit, offset: ctrl.offset})
                .then(cards => {
                    if (typeof cards.data != 'undefined') {
                        m.startComputation();
                        ctrl.cardsList(cards.data);
                        ctrl.is_initialized(true);
                        m.endComputation();
                    } else {
                        console.error('Unexpected response');
                        console.error(cards);
                        return m.flashError(Conf.tr('Can not get cards'))
                    }
                })
                .catch(error => {
                    console.error(error);
                    if (error.name === 'ApiError') {
                        return m.flashApiError(error);
                    }

                    return m.flashError(Conf.tr("Can not get cards"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

        this.getCardsList();

        this.getCard = function (card, e) {
            e.preventDefault();
            m.onLoadingStart();
            return ctrl.generateQRCode(Auth.keypair().seed(), card.seed)
                .then(qrcode => {
                    m.startComputation();
                    Session.modal(
                        <div class="panel panel-color panel-primary text-center">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr('Value of a card')}: {parseFloat(card.amount).toFixed(2)} {card.asset}</h3>
                                <p class="panel-sub-title font-13">{Conf.tr('Card account')} : {card.account_id}</p>
                            </div>
                            <div class="panel-body">
                                <div id="qrCode">{qrcode}</div>
                            </div>
                        </div>
                        , Conf.tr("Your QRCode"));
                    m.endComputation();
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

        this.generateQRCode = function(agent_seed, card_seed) {

            return new Promise(function (resolve) {
                //consts
                var typeNumber = 8;
                var errorCorrectionLevel = 'L';
                var WALLET_QR_OPERATION_TYPE = 2;
                var size = 5;

                var seed = sjcl.decrypt(agent_seed, atob(card_seed));
                var qr = qrcode(typeNumber, errorCorrectionLevel);
                var card_data = {
                    't': WALLET_QR_OPERATION_TYPE,
                    'seed': seed
                };

                qr.addData(JSON.stringify(card_data));
                qr.make();

                resolve(m.trust(qr.createImgTag(size, 2)));
            });

        };
    },

    view: function (ctrl) {
        return m.component(Wrapper, {
            title: Conf.tr("Cards"),
            tpl: (ctrl.is_initialized()) ?
                    <div>
                        {!ctrl.cardsList().length ?
                            <div class="alert alert-warning">
                                <p>{Conf.tr('There is no cards created yet')}</p>
                                <p><a href="/cards/generate" config={m.route}>{Conf.tr('Create new')}</a></p>
                            </div>
                            :
                            <div class="col-md-12">
                                <div class="panel panel-color panel-primary">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr('Cards, created by the agent')}</h3>
                                    </div>
                                    <div class="panel-body">
                                        <div class="table-responsive">
                                            <table class="table">
                                                <thead>
                                                <tr>
                                                    <th>{Conf.tr('Amount')}</th>
                                                    <th>{Conf.tr('Currency')}</th>
                                                    <th>{Conf.tr('Account')}</th>
                                                    <th>{Conf.tr('Date of creation')}</th>
                                                    <th>{Conf.tr('Date of usage')}</th>
                                                    <th>{Conf.tr('Card info')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    ctrl.cardsList().map(function (card) {
                                                        return <tr>
                                                            <td>{parseFloat(card.amount).toFixed(2)}</td>
                                                            <td>{card.asset}</td>
                                                            <td>{card.account_id}</td>
                                                            <td>{Helpers.getDateFromTimestamp(card.created_date)}</td>
                                                            <td>{card.is_used ? Helpers.getDateFromTimestamp(card.used_date) : '-'}</td>
                                                            <td>
                                                                <button class="btn btn-primary btn-xs"
                                                                        onclick={ctrl.getCard.bind(ctrl, card)}
                                                                >
                                                                    {Conf.tr('Show QR')}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    })
                                                }
                                                </tbody>
                                            </table>
                                        </div>
                                        {m.component(Pagination, {pagination: ctrl.pagination_data()})}
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
        });
    }
};
