var Conf = require('../config/Config.js');
var Session = require('../models/Session.js');

module.exports = {
    controller: function() {
        var ctrl = this;
    },

    view: function(ctrl) {
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
            </div>
    }
};