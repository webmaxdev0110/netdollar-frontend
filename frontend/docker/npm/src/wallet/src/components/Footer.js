var Session = require('../models/Session');

module.exports = {
    controller: function() {
        var ctrl = this;
    },

    view: function(ctrl) {
        return <div>
            {Session.modalMessage()?
                m('div', {
                    style: {
                        position: 'absolute',
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
                        m(".col-md-6.col-md-offset-3", [
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
            <footer class="footer text-right">
                <div class="container">
                    <div class="row">
                        <div class="col-xs-12">
                            © 2016 - {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </footer>
            </div>
    }
};