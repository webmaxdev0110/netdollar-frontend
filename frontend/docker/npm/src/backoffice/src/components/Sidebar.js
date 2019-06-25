var menuItems = require('../models/Menu-items');
var Conf = require('../config/Config.js');
var Auth = require('../models/Auth.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.current_route = m.route();
        var exist_params   = this.current_route.indexOf('?');
        this.current_route = this.current_route.substring(0, exist_params != -1 ? exist_params : this.current_route.length);

        // check if current sub-menu item is in parent menu to keep sub-menu opened
        this.isRouteInSubItems = function (subItems) {
            return _.find(subItems, function(keys) { return keys.route === ctrl.current_route }) ? true : false;
        };

        // check if current menu or sub-menu item is selected to highlight it in menu
        this.isSelected = function (item) {
            if (ctrl.current_route === item.route) {
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
                                            return <li class={subItem.route === ctrl.current_route ? 'active' : ''}>
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