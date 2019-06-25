var Conf           = require('../../config/Config.js'),
    Navbar         = require('../../components/Navbar.js'),
    Footer         = require('../../components/Footer.js'),
    Sidebar        = require('../../components/Sidebar.js'),
    CommissionForm = require('../../components/CommissionForm'),
    Auth           = require('../../models/Auth');

module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.direction = m.prop(false);

        this.inputs = m.prop({
            from_acc : false,
            to_acc   : false,
            from_type: false,
            to_type  : false
        });

        this.changeDirection = function (e) {
            ctrl.setDirection(e.target.value);
        };

        this.setDirection = function (direction) {
            m.startComputation();
            ctrl.inputs().from_acc  = false;
            ctrl.inputs().to_acc    = false;
            ctrl.inputs().from_type = false;
            ctrl.inputs().to_type   = false;
            ctrl.direction(direction);
            switch (ctrl.direction()) {
                case Conf.directions[0]:
                    ctrl.inputs().from_acc = true;
                    break;

                case Conf.directions[1]:
                    ctrl.inputs().to_acc   = true;
                    break;

                case Conf.directions[2]:
                    ctrl.inputs().from_acc = true;
                    ctrl.inputs().to_acc   = true;
                    break;

                case Conf.directions[3]:
                    ctrl.inputs().from_acc = true;
                    ctrl.inputs().to_type  = true;
                    break;

                case Conf.directions[4]:
                    ctrl.inputs().to_acc    = true;
                    ctrl.inputs().from_type = true;
                    break;
            }
            m.endComputation();
        };

        this.setDirection(Conf.directions[0]);

        this.assets = m.prop([]);

        this.getAssets = function () {
            m.onLoadingStart();

            return Conf.horizon.assets()
                .call()
                .then((assets) => {
                    m.startComputation();
                    ctrl.assets(assets.records);
                    m.endComputation();
                })
                .catch(() => {
                    m.flashError(Conf.tr("Error requesting currencies"));
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        };

        this.getAssets();
    },

    view: function (ctrl) {
        return <div id="wrapper">
            {m.component(Navbar)}
            {m.component(Sidebar)}
            <div class="content-page">
                <div class="content">
                    <div class="container">
                        {
                            ctrl.assets().length ?
                                <div>
                                    <div class="col-lg-12">
                                        <div class="panel panel-primary panel-border">
                                            <div class="panel-heading">
                                                <h3 class="panel-title">{Conf.tr("Select way of direction")}</h3>
                                            </div>
                                            <div class="panel-body">
                                                <div class="col-lg-12">
                                                    <form class="form-horizontal" id="commission_form" role="form"
                                                          method="post">

                                                        <div class="form-group">
                                                            <label for="select"
                                                                   class="col-md-2 control-label">{Conf.tr("Direction")}</label>
                                                            <div class="col-md-4">
                                                                <select class="form-control" name="direction" id="direction"
                                                                        onchange={ctrl.changeDirection.bind(ctrl)}>
                                                                    {Conf.directions.map(direction => {
                                                                        return <option
                                                                            value={direction}>{Conf.tr(direction)}</option>
                                                                    })}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="clearfix"></div>
                                    {ctrl.direction() ?
                                        m.component(CommissionForm, ctrl.direction(), ctrl.inputs)
                                        :
                                        ''
                                    }
                                </div>
                                :
                                <div class="portlet">
                                    <div class="portlet-heading bg-warning">
                                        <h3 class="portlet-title">
                                            {Conf.tr('No currencies found')}
                                        </h3>
                                        <div class="portlet-widgets">
                                            <a data-toggle="collapse" data-parent="#accordion1" href="#bg-warning">
                                                <i class="ion-minus-round"></i>
                                            </a>
                                            <span class="divider"></span>
                                            <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                        </div>
                                        <div class="clearfix"></div>
                                    </div>
                                    <div id="bg-warning" class="panel-collapse collapse in">
                                        <div class="portlet-body">
                                            {Conf.tr('Please')}<a href='/currencies/create' config={m.route}> {Conf.tr("create")}</a>!
                                        </div>
                                    </div>
                                </div>
                        }
                    </div>
                </div>
            </div>
            {m.component(Footer)}
        </div>
    }
};