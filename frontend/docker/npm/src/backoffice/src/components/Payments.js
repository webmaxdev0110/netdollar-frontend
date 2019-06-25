var Auth    = require('../models/Auth.js'),
Conf        = require('../config/Config.js'),
DateFormat  = require('dateformat');

module.exports = {
    controller: function () {
    },

    view: function (ctrl, data) {
        return !data || !data.payments.length ?
                <p class="text-primary">{Conf.tr("No payments yet")}</p>
            :
            <div>
                <div class="hidden-xs">
                    <table class="table table-striped m-0">
                        <thead>
                        <tr>
                            <th>{Conf.tr("ID")}</th>
                            <th>{Conf.tr("Date")}</th>
                            <th>{Conf.tr("Amount")}</th>
                            <th>{Conf.tr("Asset")}</th>
                            <th>{Conf.tr("From")}</th>
                            <th>{Conf.tr("To")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.payments.map(function (payment) {
                            return <tr>
                                <td>{payment.id}</td>
                                <td>{DateFormat(payment.closed_at, 'dd.mm.yyyy HH:MM:ss')}</td>
                                <td>{parseFloat(payment.amount).toFixed(2)}</td>
                                <td>{payment.asset_code}</td>
                                <td>
                                    <a href={"/analytics/account/" + payment.from} config={m.route}>
                                            <span title={payment.from}>
                                                {payment.from.substr(0, 15) + '...'}
                                            </span>
                                    </a>
                                </td>
                                <td>
                                    <a href={"/analytics/account/" + payment.to} config={m.route}>
                                            <span title={payment.to}>
                                                {payment.to.substr(0, 15) + '...'}
                                            </span>
                                    </a>
                                </td>
                            </tr>
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

    }
}