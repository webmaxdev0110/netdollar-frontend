var Conf = require('../config/Config.js'),
    Navbar = require('../components/Navbar.js'),
    Helpers = require('../components/Helpers.js'),
    Footer = require('../components/Footer.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.tx_id              = m.route.param('transaction_id');
        this.tx_data            = m.prop(null);
        this.tx_type            = m.prop(null);
        this.tx_label           = m.prop(null);
        this.account_data       = m.prop(null);
        this.account_type       = m.prop(null);

        this.getTxInfo = function () {
            m.onLoadingStart();
            Conf.horizon.transactions()
                .transaction(ctrl.tx_id)
                .call()
                .then(function (transaction) {
                    m.startComputation();
                    ctrl.tx_data(transaction);

                    switch(transaction.memo) {

                        case 'card_creation':
                            ctrl.tx_type(Conf.tr('Card creation'));
                            ctrl.tx_label('success');
                            break;

                        case 'funding_card':
                            ctrl.tx_type(Conf.tr('Funding card'));
                            ctrl.tx_label('purple');
                            break;

                        case 'by_invoice':
                            ctrl.tx_type(Conf.tr('By invoice'));
                            ctrl.tx_label('warning');
                            break;
                        default:
                            ctrl.tx_type(Conf.tr('Regular'));
                            ctrl.tx_label('primary');
                    }

                    if (
                        Conf.merchant_prefix && typeof transaction.memo != 'undefined'
                        && transaction.memo.substring(0, Conf.merchant_prefix.length) == Conf.merchant_prefix
                        )
                    {
                        ctrl.tx_type(Conf.tr('Merchant'));
                        ctrl.tx_label('warning');
                    }
                    m.endComputation();

                    return Conf.horizon.accounts()
                        .accountId(transaction.source_account)
                        .call()
                })
                .then(function (account) {
                    m.startComputation();
                    ctrl.account_data(account);
                    ctrl.account_type(Helpers.getTextAccountType(account.type_i));
                    m.endComputation();
                })
                .catch(function (err) {
                    console.log(err)
                })
                .then(function () {
                    m.onLoadingEnd();
                })
        };

        this.getTxInfo();

    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            <div class="content-page">
                <div class="wrapper">
                    <div class="container">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="panel panel-default panel-color">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr('Transaction info')}</h3>
                                    </div>
                                    {
                                        ctrl.account_data() ?
                                            <div class="panel-body">
                                                <div class="user-box">
                                                    <img src={"/assets/images/users/" + ctrl.account_data().type_i + ".png"} width="70" />
                                                    <div>
                                                        <p>{ctrl.account_type()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            :
                                        Conf.tr('Loading') + '...'
                                    }
                                    {
                                        ctrl.tx_data() ?
                                            <div class="panel-body">
                                                <div class="container">
                                                    <div class="row">
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>
                                                                {Conf.tr('Transaction type')}:
                                                                <div>
                                                                    <span>
                                                                        <label class={"label label-" + ctrl.tx_label()}>{ctrl.tx_type()}</label>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>{Conf.tr('Date of create')}:</div>
                                                            <div>
                                                                {Helpers.getNormalizeDate(ctrl.tx_data().created_at)}
                                                            </div>
                                                        </div>
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>{Conf.tr('Account')}:</div>
                                                            <div class="acc_overflow">
                                                                {ctrl.tx_data().source_account}
                                                            </div>
                                                        </div>
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>{Conf.tr('Memo')}: </div>
                                                            <div>
                                                                {ctrl.tx_data().memo}
                                                            </div>
                                                        </div>
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>{Conf.tr('Operations count')}:</div>
                                                            <div>
                                                                {ctrl.tx_data().operation_count}
                                                            </div>
                                                        </div>
                                                        <div class="col-lg-2 wrp-tb-tr">
                                                            <div>{Conf.tr('Transaction ID')}:</div>
                                                            <div class="acc_overflow">
                                                                {ctrl.tx_data().id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            :
                                        Conf.tr('Loading') + '...'
                                    }
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