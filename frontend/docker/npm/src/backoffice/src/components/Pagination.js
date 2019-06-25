var Auth = require('../models/Auth.js'),
    Conf = require('../config/Config.js');

module.exports = {
    controller: function (data) {
        var ctrl = this;
        
        this.current_page       = m.prop(data.pagination.page);
        this.next_page_offset   = m.prop(ctrl.current_page() * Conf.pagination.limit);
        this.func               = m.prop(data.pagination.func);
        this.module             = m.prop(data.pagination.module);
        this.params             = m.prop(data.pagination.params || {});
        this.btn_prev           = m.prop(false);
        this.btn_next           = m.prop(false);
        this.previous_page      = m.prop(ctrl.current_page() - 1);
        this.next_page          = m.prop(ctrl.current_page() + 1);

        this.has_previous_page = function ()
        {
            return ctrl.previous_page() >= 1;
        };

        this.getNextPageItems = function ()
        {
            return Conf.SmartApi[ctrl.module()][ctrl.func()](Object.assign(ctrl.params(), {limit: Conf.pagination.limit, offset: ctrl.next_page_offset()}))
        };

        //check prev/next buttons
        m.onLoadingStart();
        ctrl.getNextPageItems()
            .then(function (list) {
                if (typeof list.data != 'undefined' && list.data.length > 0) {
                    m.startComputation();
                    ctrl.btn_next(true);
                    m.endComputation();
                }
                m.startComputation();
                ctrl.btn_prev(ctrl.has_previous_page());
                m.endComputation();
            })
            .catch(function (err) {
                console.error(err);
                ctrl.btn_next(false);
            })
            .then(function () {
                m.onLoadingEnd();
            });
        
        
        this.prev = function (e) {
            e.preventDefault();
            m.route(m.route().split("?")[0] + '?page=' + ctrl.previous_page());
        };

        this.next = function (e) {
            e.preventDefault();
            m.route(m.route().split("?")[0] + '?page=' + ctrl.next_page());
        };
    },

    view: function (ctrl, data) {
        return <ul class="pager">
                    {ctrl.btn_prev() ?
                        <li class="previous">
                            <a href="#" onclick={ctrl.prev.bind(ctrl)}>{Conf.tr("Prev")}</a>
                        </li>
                            :
                        ''
                    }
                    {ctrl.btn_next() ?
                        <li class="next">
                            <a href="#" onclick={ctrl.next.bind(ctrl)}>{Conf.tr("Next")}</a>
                        </li>
                            :
                        ''
                    }
                </ul>

    }
};

