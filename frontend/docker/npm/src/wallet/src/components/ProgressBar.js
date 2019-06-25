const Conf = require('../config/Config.js');

module.exports = {
    controller: function(data) {
        this.progress = data.value;
    },

    view: function(ctrl, data) {
        return <div>
            <div class="card-box">
                <h4 class="text-primary">{data.text}</h4>
                <p class="text-muted">{Conf.tr("Please wait...")}</p>

                <div class="progress progress-lg">
                    <div id="progress_bar" class="progress-bar progress-bar-info"
                         role="progressbar"  style={"width: " + ctrl.progress() + "%;"}
                         aria-valuenow={ctrl.progress()} aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
            </div>

        </div>
    }
};