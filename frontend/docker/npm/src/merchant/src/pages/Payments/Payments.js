var Conf = require('../../config/Config.js'),
    Navbar = require('../../components/Navbar.js'),
    Footer = require('../../components/Footer.js'),
    Auth = require('../../models/Auth.js'),
    Sidebar = require('../../components/Sidebar.js'),
    Payments = require('../../components/Payments.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.current_cursor = m.prop(null);
        this.payments = m.prop([]);
        this.next = m.prop(false);

        this.checkNextPaymentsExist = function () {

            m.startComputation();
            ctrl.next(false);
            m.endComputation();

            return ctrl.current_cursor().next()
                .then(function (next_result) {

                    if (next_result.records.length > 0) {
                        m.startComputation();
                        ctrl.next(true);
                        m.endComputation();
                    }

                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })

        };

        //show next payments
        this.loadMorePayments = function (e) {
            e.preventDefault();

            m.onLoadingStart();

            ctrl.current_cursor().next()
                .then(function (result) {
                    m.startComputation();
                    ctrl.current_cursor(result);
                    ctrl.payments(ctrl.payments().concat(result.records));
                    m.endComputation();

                    return ctrl.checkNextPaymentsExist();
                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })
                .then(() => {
                    m.onLoadingEnd();
                });
        };

        Conf.horizon.payments()
            .forAccount(Auth.keypair().accountId())
            .order('desc')
            .limit(Conf.payments.onpage)
            .call()
            .then(function (result) {

                m.startComputation();
                ctrl.current_cursor(result);
                ctrl.payments(result.records);
                m.endComputation();

                return ctrl.checkNextPaymentsExist();

            })
            .catch(err => {
                // If you're here, everything's still ok - it means acc wasn't created yet
            });

    },

    view: function (ctrl) {
        return <div class="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        <div class="panel panel-color panel-primary">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                                <p class="panel-sub-title font-13">{Conf.tr("Overview of recent transactions")}.</p>
                            </div>

                            <div class="panel-body">
                                {m.component(Payments, {payments: ctrl.payments()})}
                            </div>

                            {(ctrl.next()) ?
                                <div class="panel-footer text-center">
                                    <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                            onclick={ctrl.loadMorePayments.bind(ctrl)}>{Conf.tr("Show older")}
                                    </button>
                                </div>
                                :
                                ''
                            }
                        </div>
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};
