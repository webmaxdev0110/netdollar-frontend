var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var DateFormat = require('dateformat');

module.exports = {
    controller: function () {
    },

    view: function (ctrl, data) {
        return !data || !data.payments.length ?
                <p class="text-primary">{Conf.tr("No payments yet")}</p>
            :
            <div>
                <div class="visible-xs">
                    {data.payments.map(function (payment, index) {
                        var trans_link = payment._links.transaction.href;
                        var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                        var accountId = payment.to == Auth.keypair().accountId() ? payment.from : payment.to;
                        //The reason for send an amount and asset code instead of payment id is that there is
                        //no method in SDK to get payment by id.
                        var trans_url = '/transaction/' + trans_id + '/' + accountId + '/' + payment.amount + '/' + payment.asset_code;
                        return <div class="payment">
                            <a class="account_overflow" href={trans_url} config={m.route}
                               title={accountId}>
                                {accountId}
                            </a>
                            <div class="row">
                                <div class="col-xs-7">
                                    <p class="text-muted">{DateFormat(payment.closed_at, 'dd.mm.yyyy HH:MM:ss')}</p>
                                </div>
                                <div class="col-xs-5 text-right">
                                    {payment.to == Auth.keypair().accountId() ?
                                        <span class="label label-success">
                                                                    <i class="fa fa-sign-in fa-fw"
                                                                       aria-hidden="true"></i>
                                            &nbsp;
                                            {parseFloat(payment.amount).toFixed(2)} {payment.asset_code}
                                                                </span>
                                        :
                                        <span class="label label-danger">
                                                                    <i class="fa fa-sign-out fa-fw"
                                                                       aria-hidden="true"></i>
                                            &nbsp;
                                            {parseFloat(payment.amount).toFixed(2)} {payment.asset_code}
                                                                </span>
                                    }
                                </div>
                                <div class="clearfix"></div>
                            </div>
                        </div>
                    })}
                </div>
                <div class="hidden-xs">
                    <table class="table table-bordered">
                        <thead>
                        <tr>
                            <th>{Conf.tr("Account id")}</th>
                            <th>{Conf.tr("Date")}</th>
                            <th>{Conf.tr("Amount")}</th>
                            <th>{Conf.tr("Type")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.payments.map(function (payment) {
                            var trans_link = payment._links.transaction.href;
                            var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                            var accountId = payment.to == Auth.keypair().accountId() ? payment.from : payment.to
                            //The reason for send an amount and asset code instead of payment id is that there is
                            //no method in SDK to get payment by id.
                            var trans_url = '/transaction/' + trans_id + '/' + accountId + '/' + payment.amount + '/' + payment.asset_code;
                            return <tr>
                                <td class="account-td">
                                    <a class="account_overflow" href={trans_url} config={m.route}>
                                        {accountId}
                                    </a>
                                </td>
                                <td>{DateFormat(payment.closed_at, 'dd.mm.yyyy HH:MM:ss')}</td>
                                <td>{parseFloat(payment.amount).toFixed(2)} {payment.asset_code}</td>
                                <td>
                                    {payment.to == Auth.keypair().accountId() ?
                                        <span class="label label-success">
                                                            <i class="fa fa-sign-in fa-fw" aria-hidden="true"></i>
                                            &nbsp;
                                            {Conf.tr("Debit")}
                                                        </span>
                                        :
                                        <span class="label label-danger">
                                                            <i class="fa fa-sign-out fa-fw" aria-hidden="true"></i>
                                            &nbsp;
                                            {Conf.tr("Credit")}
                                                        </span>
                                    }
                                </td>
                            </tr>
                        })}

                        </tbody>
                    </table>
                </div>
            </div>

    }
}