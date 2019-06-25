var Conf     = require('../../config/Config.js'),
    Navbar   = require('../../components/Navbar.js'),
    Footer   = require('../../components/Footer.js'),
    Payments = require('../../components/Payments.js'),
    Sidebar  = require('../../components/Sidebar.js'),
    Auth     = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.payments = m.prop([]);

        this.btn_prev = m.prop(false);
        this.btn_next = m.prop(false);

        this.account = m.prop(m.route.param('accountId'));

        this.handleBtnToTop = function (e) {
            e.preventDefault();

            ctrl.getPayments();
        };

        this.getPayments = function (e) {
            return Conf.horizon.payments()
                .forAccount(ctrl.account())
                .order('desc')
                .call()
                .then((payments) => {
                    m.startComputation();
                    ctrl.payments(payments.records);
                    m.endComputation();

                    ctrl.checkPrev();
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.next = function (e) {
            e.preventDefault();

            // get last record's paging token for cursor
            var next_cursor = ctrl.payments().slice(-1).pop().paging_token;

            return Conf.horizon.payments()
                .forAccount(ctrl.account())
                .cursor(next_cursor)
                .order('desc')
                .call()
                .then((payments) => {
                    m.startComputation();
                    ctrl.payments(payments.records);
                    m.endComputation();

                    ctrl.checkPrev();
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.prev = function (e) {
            e.preventDefault();

            // get first record's paging token for cursor
            var prev_cursor = ctrl.payments()[0].paging_token;

            return Conf.horizon.payments()
                .forAccount(ctrl.account())
                .cursor(prev_cursor)
                .call()
                .then((payments) => {
                    m.startComputation();
                    var records = payments.records.sort(function (a, b) {
                        return parseInt(b.id) - parseInt(a.id);
                    });
                    ctrl.payments(records);

                    m.endComputation();

                    ctrl.checkPrev();
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.checkPrev = function () {
            var prev_cursor = ctrl.payments()[0].paging_token;

            return Conf.horizon.payments()
                .forAccount(ctrl.account())
                .cursor(prev_cursor)
                .limit(1)
                .call()
                .then((payments) => {
                    m.startComputation();
                    (payments.records && payments.records.length > 0) ? ctrl.btn_prev(true) : ctrl.btn_prev(false);
                    m.endComputation();
                })
                .catch((err) => {
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.checkNext = function () {
            var next_cursor = ctrl.payments().slice(-1).pop().paging_token;

            return Conf.horizon.payments()
                .forAccount(ctrl.account())
                .cursor(next_cursor)
                .limit(1)
                .order('desc')
                .call()
                .then((payments) => {
                    m.startComputation();
                    (payments.records && payments.records.length > 0) ? ctrl.btn_next(true) : ctrl.btn_next(false);
                    m.endComputation();
                })
                .catch((err) => {
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.getPayments();
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="card-box">
                            <h4 class="m-t-0 header-title">{Conf.tr("Payments") + ' - ' + Conf.tr("Account") + ' : ' + ctrl.account()}</h4>
                            <div style="float: right">
                                <button class="btn-outline" onclick={ctrl.handleBtnToTop.bind(ctrl)}>{Conf.tr("To the begining")}</button>
                            </div>

                            {m.component(Payments, {payments: ctrl.payments()})}

                            <ul class="pager">
                                {ctrl.btn_prev() ?
                                    <li className="previous">
                                        <a href="#" onclick={ctrl.prev.bind(ctrl)}>← {Conf.tr("Prev")}</a>
                                    </li>
                                    :
                                    ''
                                }
                                {ctrl.btn_next() ?
                                    <li class="next">
                                        <a href="#"
                                           onclick={ctrl.next.bind(ctrl)}>{Conf.tr("Next")}
                                            →</a>
                                    </li>
                                    :
                                    ''
                                }
                            </ul>

                        </div>

                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};