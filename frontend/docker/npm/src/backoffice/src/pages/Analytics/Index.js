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

        this.payments  = m.prop([]);
        this.date_from = m.prop(false);
        this.date_to   = m.prop(false);
        this.btn_prev  = m.prop(false);
        this.btn_next  = m.prop(false);

        this.getFormattedDate = function (date) {
            var f_date = new Date(date);
            return f_date.getFullYear() + '-' + ("0" + (f_date.getMonth() + 1)).slice(-2) + '-' + ("0" + f_date.getDate()).slice(-2);
        };

        this.handleBtnToTop = function (e) {
            e.preventDefault();
            ctrl.getPayments();
        };

        this.getPayments = function (e) {
            m.onLoadingStart();
            return Conf.horizon.payments()
                .order('desc')
                .call()
                .then((payments) => {
                    if (payments.records.length) {
                        m.startComputation();
                        ctrl.payments(payments.records);
                        ctrl.date_from(payments.records[payments.records.length - 1].closed_at);
                        ctrl.date_to(payments.records[0].closed_at);
                        m.endComputation();
                    }
                    return ctrl.checkPrev();
                })
                .then(function(){
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting payments"));
                })
                .then(function(){
                    m.onLoadingEnd();
                })
        };

        this.next = function (e) {
            e.preventDefault();

            // get last record's paging token for cursor
            var next_cursor = ctrl.payments().slice(-1).pop().paging_token;

            return Conf.horizon.payments()
                .cursor(next_cursor)
                .order('desc')
                .call()
                .then((payments) => {
                    if (payments.records.length) {
                        m.startComputation();
                        ctrl.payments(payments.records);
                        ctrl.date_from(payments.records[payments.records.length - 1].closed_at);
                        ctrl.date_to(payments.records[0].closed_at);
                        m.endComputation();
                    }
                    return ctrl.checkPrev();
                })
                .then(function(){
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.prev = function (e) {
            e.preventDefault();

            // get first record's paging token for cursor
            var prev_cursor = ctrl.payments()[0].paging_token;

            return Conf.horizon.payments()
                .cursor(prev_cursor)
                .call()
                .then((payments) => {
                    m.startComputation();
                    var records = payments.records.sort(function (a, b) {
                        return parseInt(b.id) - parseInt(a.id);
                    });
                    ctrl.payments(records);
                    ctrl.date_to(payments.records[0].closed_at);
                    ctrl.date_from(payments.records[payments.records.length - 1].closed_at);
                    m.endComputation();

                    return ctrl.checkPrev();
                })
                .then(function(){
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.getPaymentsByDate = function () {
            var date_from = new Date(ctrl.date_from()).toISOString();
            var date_to = new Date(ctrl.date_to()).toISOString();

            return Conf.horizon.payments()
                .after(date_from)
                .before(date_to)
                .call()
                .then((payments) => {
                    m.startComputation();
                    var records = payments.records.sort(function (a, b) {
                        return parseInt(b.id) - parseInt(a.id);
                    });
                    ctrl.payments(records);
                    m.endComputation();

                    return ctrl.checkPrev();
                })
                .then(function(){
                    return ctrl.checkNext();
                })
                .catch((err) => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting payments"));
                })
        };

        this.handleDateFrom = function (e) {
            ctrl.date_from(e.target.value);
            ctrl.getPaymentsByDate();
        };

        this.handleDateTo = function (e) {
            ctrl.date_to(e.target.value);
            ctrl.getPaymentsByDate();
        };


        this.checkPrev = function () {

            if (!ctrl.payments().length) {
                return false;
            }

            m.onLoadingStart();
            var prev_cursor = ctrl.payments()[0].paging_token;

            return Conf.horizon.payments()
                .cursor(prev_cursor)
                .limit(1)
                .call()
                .then((payments) => {
                    m.startComputation();
                    ctrl.btn_prev(payments.records && payments.records.length > 0);
                    m.endComputation();
                })
                .then(function(){
                    m.onLoadingEnd();
                })
                .catch((err) => {
                    console.error(err);
                    m.flashError(Conf.tr("Error requesting payments"));
                })

        };

        this.checkNext = function () {

            if (!ctrl.payments().length) {
                return false;
            }

            m.onLoadingStart();
            var next_cursor = ctrl.payments().slice(-1).pop().paging_token;

            return Conf.horizon.payments()
                .cursor(next_cursor)
                .limit(1)
                .order('desc')
                .call()
                .then((payments) => {
                    m.startComputation();
                    ctrl.btn_next(payments.records && payments.records.length > 0)
                    m.endComputation();
                })
                .then(function(){
                    m.onLoadingEnd();
                })
                .catch((err) => {
                    console.error(err);
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
                        {
                            ctrl.payments().length ?
                                <div class="card-box">
                                    <h4 class="m-t-0 header-title">{Conf.tr("Payments")}</h4>
                                    <form class="form-inline" method="post">
                                        <div class="form-group">
                                            <label for="date_from">{Conf.tr("from")}&nbsp;</label>
                                            <input class="form-control" id="date_from" type="date" name="date_from"
                                                   onchange={ctrl.handleDateFrom.bind(ctrl)}
                                                   value={ctrl.getFormattedDate(ctrl.date_from())}/>
                                        </div>
                                        <div class="form-group">
                                            <label for="date_from">&nbsp;{Conf.tr("to")}&nbsp;</label>
                                            <input class="form-control" id="date_to" type="date" name="date_to"
                                                   onchange={ctrl.handleDateTo.bind(ctrl)}
                                                   value={ctrl.getFormattedDate(ctrl.date_to())}/>
                                        </div>
                                        <div style="float: right">
                                            <button class="btn-outline" onclick={ctrl.handleBtnToTop.bind(ctrl)}>{Conf.tr("To the begining")}</button>
                                        </div>
                                    </form>

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
                                :
                                <h3>{Conf.tr('No payments yet')}</h3>
                        }
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};