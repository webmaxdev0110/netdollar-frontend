var Auth = require('../models/Auth.js');
var Helpers = require('../components/Helpers.js');
var Conf = require('../config/Config.js');
var Session = require('../models/Session.js');

module.exports = {

    controller: function () {
        var ctrl = this;

        this.refreshPage = function () {
            m.route(m.route());
        };
    },

    view: function (ctrl, data) {
        var content = (!data || !data.tpl) ? '' : data.tpl;
        var title = (!data || !data.title) ? Conf.tr("Dashboard") : data.title;

        return <div>
            {Session.modalMessage()?

                m('div', {
                    style: {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        padding: '7.5%',
                        paddingLeft: 0,
                        paddingRight: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 9999,
                        width: '100%',
                        height: '100%'
                    },
                },[
                    m(".row", [
                        m(".col-md-" + Session.modalSize() + ".col-md-offset-" + ((12 - Session.modalSize())/2).toString(), [
                            [m(".portlet", [
                                m(".portlet-heading.bg-primary", {style: {borderRadius: 0}}, [
                                    m("h3.portlet-title", Session.modalTitle() || Conf.tr('Message')),
                                    m(".portlet-widgets", [
                                        m("a[href='#']", {
                                            onclick: function(e){e.preventDefault(); Session.closeModal()}
                                        }, [m("i.ion-close-round")])
                                    ]),
                                    m(".clearfix")
                                ]),
                                m(".portlet-body", Session.modalMessage())
                            ])]
                        ]),
                        m(".clearfix")
                    ])
                ])
                :
                ''
            }
            <div id="wrapper">
                <div class="topbar">
                    <div class="topbar-left hidden-xs">
                        <div class="text-center">
                            <a href="/" class="logo"><svg class="logo-img"></svg></a>
                        </div>
                    </div>
                    <div class="navbar navbar-default" role="navigation">
                        <div class="container">
                            <div class="">
                                <div class="pull-left">
                                    <button class="button-menu-mobile open-left waves-effect">
                                        <i class="md md-menu"></i>
                                    </button>
                                    <span class="clearfix"></span>
                                </div>
                                <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                                    <li>
                                        <a href="#" onclick={Auth.logout}>
                                            <span class="fa fa-power-off align-middle m-r-5 f-s-20"></span>
                                            <span class="align-middle">{Conf.tr("Logout")}</span>
                                        </a>
                                    </li>
                                </ul>
                                <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                                    <li class="dropdown">
                                        <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                                            <span class="fa fa-language align-middle m-r-5 f-s-20"></span>
                                            <span class="align-middle">{Conf.current_language}</span>
                                            &nbsp;
                                            <span class="fa fa-caret-down align-middle f-s-20"></span>
                                        </a>
                                        <ul class="dropdown-menu dropdown-user">
                                            <li>
                                                <a onclick={Conf.loc.changeLocale.bind(ctrl, 'en')} href="#"><img
                                                    src="/assets/img/flags/en.png"/> English</a>
                                                <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ua')} href="#"><img
                                                    src="/assets/img/flags/ua.png"/> Українська</a>
                                                <a onclick={Conf.loc.changeLocale.bind(ctrl, 'ru')} href="#"><img
                                                    src="/assets/img/flags/ru.png"/> Русский</a>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                                <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                                    <li>
                                        <a
                                            href="#"
                                            onclick={function(){return Conf.SmartApi.Api.refreshNonce()}}
                                            title={Conf.tr('Time before the session close. Click to update session.')}
                                        >
                                            <span class="fa fa-clock-o m-r-5 align-middle f-s-20"></span>
                                            <span class="align-middle" id="spinner-time">
                                            {
                                                !Auth.ttl() ?
                                                    ''
                                                    :
                                                    Helpers.getTimeFromSeconds(Auth.ttl())
                                            }
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                                <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                                    <li>
                                        <a
                                            href="#"
                                            onclick={ctrl.refreshPage.bind(ctrl)}
                                            title={Conf.tr('Click for update page.')}
                                        >
                                            <span class="fa fa-refresh align-middle f-s-20"></span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="left side-menu">
                    <div class="sidebar-inner slimscrollleft">
                        <div id="sidebar-menu">
                            {
                                Auth.balances().length ?
                                    <div class="col-lg-12">
                                        <div class="panel panel-border panel-primary">
                                            <div class="panel-body">
                                                <h5 class="m-l-5">{Conf.tr('Balances')}</h5>
                                                <div class="table-responsive">
                                                    <table class="table table-striped">
                                                        <tbody>
                                                        {
                                                            Auth.balances().map(function (balance) {
                                                                return <tr>
                                                                    <td>{parseFloat(balance.balance).toFixed(2)}</td>
                                                                    <td>{balance.asset_code}</td>
                                                                    </tr>
                                                            })
                                                        }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    :
                                    ''
                            }
                            <div class="col-lg-12 text-center">
                                <button
                                    class="btn-xs btn-warning waves-effect waves-light m-t-10 m-b-10"
                                    onclick={function(){
                                        Session.modal(Auth.keypair().accountId(), Conf.tr("Your account"))
                                    }}
                                >{Conf.tr("Show account")}</button>
                            </div>
                                {
                                    Auth.type() == 'distribution' ?
                                        <ul>
                                            <li>
                                                <a href="/cards" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-qrcode"></i> <span>{Conf.tr("Scratch cards")}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="/cards/generate" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-credit-card"></i> <span>{Conf.tr("Create scratch cards")}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="/transfer" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-money"></i> <span>{Conf.tr("Transfer money")}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="/payments" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-history"></i> <span>{Conf.tr("Payments")}</span>
                                                </a>
                                            </li>
                                            {
                                                Auth.wallet() ?
                                                    <li>
                                                        <a href="/settings" config={m.route} class="waves-effect waves-primary">
                                                            <i class="fa fa-cogs"></i> <span>{Conf.tr("Settings")}</span>
                                                        </a>
                                                    </li>
                                                    : ''
                                            }
                                        </ul>
                                        :
                                        <ul>
                                            <li>
                                                <a href="/settlement" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-qrcode"></i> <span>{Conf.tr("Settlement")}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="/invoices" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-qrcode"></i> <span>{Conf.tr("Invoices")}</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="/payments" config={m.route} class="waves-effect waves-primary">
                                                    <i class="fa fa-history"></i> <span>{Conf.tr("Payments")}</span>
                                                </a>
                                            </li>
                                            {
                                                Auth.wallet() ?
                                                    <li>
                                                        <a href="/settings" config={m.route} class="waves-effect waves-primary">
                                                            <i class="fa fa-cogs"></i> <span>{Conf.tr("Settings")}</span>
                                                        </a>
                                                    </li>
                                                    : ''
                                            }
                                        </ul>

                                }
                            <div class="clearfix"></div>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                </div>
                <div class="content-page">
                    <div class="content">
                        <div class="container">
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="page-title-box">
                                        <ol class="breadcrumb pull-right">
                                            <li class="active">{Conf.project_name}</li>
                                            <li class="active">{title}</li>
                                        </ol>
                                        <h4 class="page-title">{title}</h4>
                                        {data.subtitle ?
                                            <p class="page-sub-title font-13">{data.subtitle}</p>
                                            :
                                            ''
                                        }
                                    </div>
                                </div>
                            </div>
                            {content}
                        </div>
                    </div>
                    <footer class="footer text-right">
                        2018 - {new Date().getFullYear()} © 
                    </footer>
                </div>
            </div>
        </div>
    }
};
