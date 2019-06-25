var menuItems = require('../models/Menu-items'),
    Conf = require('../config/Config.js'),
    Auth = require('../models/Auth');

var Session = require('../models/Session.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        // check if current sub-menu item is in parent menu to keep sub-menu opened
        this.isRouteInSubItems = function (subItems) {
            return subItems.find(keys => keys.route === m.route()) ? true : false;
        };

        // check if current menu or sub-menu item is selected to highlight it in menu
        this.isSelected = function (item) {
            if (m.route() === item.route) {
                return true;
            } else if (item.subItems) {
                return ctrl.isRouteInSubItems(item.subItems) ? true : false;
            }

        }
    },
    view: function(ctrl) {
        return <div class="left side-menu">
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
                    <ul>
                        {menuItems.map(function (item) {

                            if (typeof item.walletonly != 'undefined' && item.walletonly) {
                                if (!Auth.wallet()) {
                                    return '';
                                }
                            }

                            return <li class={item.subItems ? 'has_sub' : ''}>
                                {item.route ?
                                    <a href={item.route} config={m.route} class={ctrl.isSelected(item) ?
                                        "waves-effect waves-primary subdrop" : "waves-effect waves-primary"}>
                                        <i class={item.icon}></i> <span> {Conf.tr(item.name)} </span>
                                        {item.subItems ? <span class="menu-arrow"></span> : ''}
                                    </a>
                                    :
                                    <a href='javascript:void(0);' class={ctrl.isSelected(item) ?
                                        "waves-effect waves-primary subdrop" : "waves-effect waves-primary"}>
                                        <i class={item.icon}></i> <span> {Conf.tr(item.name)} </span>
                                        {item.subItems ? <span class="menu-arrow"></span> : ''}

                                    </a>
                                }
                                {item.subItems ?
                                    <ul className="list-unstyled" style={ctrl.isRouteInSubItems(item.subItems) ? 'display: block' : ''}>
                                        {item.subItems.map(function(subItem) {
                                            return <li class={subItem.route === m.route() ? 'active' : ''}>
                                                <a href={subItem.route} config={m.route}>{Conf.tr(subItem.name)}</a>
                                            </li>
                                        })}
                                    </ul>
                                : '' }
                            </li>
                        })}
                    </ul>
                    <div class="clearfix"></div>
                </div>

                <div class="clearfix"></div>
            </div>
        </div>
    }
};