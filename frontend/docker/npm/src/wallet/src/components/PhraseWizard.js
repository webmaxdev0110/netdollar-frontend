var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

var LAST_WIZARD_STAGE = 2;
var WORDS_PER_PAGE = 4;

var Wizard = module.exports = {
    controller: function () {
        var ctrl = this;
        this.mnemoWizardStage = m.prop(0);
        this.wordsPage = m.prop(0);
        this.randomWords = m.prop(new Array());
        this.checkWords = m.prop(Array.apply(null, Array(WORDS_PER_PAGE)).map(String.prototype.valueOf, ''));
        this.isSuccess = m.prop(false);
        this.nextDisabled = m.prop(false);

        this.doWordsStep = function (max, dir, e) {
            e.preventDefault();
            var newPage = ctrl.wordsPage() + dir;
            m.startComputation();
            if ((newPage >= 0) && (newPage < max)) {
                ctrl.wordsPage(newPage);
            }
            if (ctrl.wordsPage() == (max-1)) {ctrl.nextDisabled(false);}
            m.endComputation();
        };

        this.getUniqueRandomIndex = function (length, randomWords) {
            var rndIndex = Math.floor(Math.random() * length);
            if (randomWords.find(function (element) {
                    return (element.index == rndIndex);
                })) {
                return this.getUniqueRandomIndex(length, randomWords);
            }
            return rndIndex;
        };

        this.showWizardStage = function (ctrl, data) {
            switch (ctrl.mnemoWizardStage()) {
                case 0:
                    return Wizard.view_wizard_stage_blank(ctrl);
                    break;
                case 1:
                    return Wizard.view_wizard_stage_words(ctrl, data.phrase);
                    break;
                case 2:
                    return Wizard.view_wizard_stage_check(ctrl, data.phrase);
                    break;
                default:
                    return "";
            }
        };

        this.doStep = function (dir, e) {
            e.preventDefault();
            var newStage = ctrl.mnemoWizardStage() + dir;
            if ((newStage >= 0) && (newStage <= LAST_WIZARD_STAGE)) {
                m.startComputation();
                if ((!ctrl.nextDisabled() && dir==1) || (dir==-1)) {
                    ctrl.nextDisabled(false);
                    ctrl.mnemoWizardStage(newStage);
                }
                m.endComputation();
            }
        };

        this.setCheckWord = function (index, value) {
            ctrl.checkWords()[index] = value;
        };

        this.complete = function (e) {
            e.preventDefault();
            try {
                ctrl.checkWords().forEach(function (key, index) {
                    if (key.toLowerCase() != ctrl.randomWords()[index].word.toLowerCase()) {
                        throw Conf.tr('Bad word $[1]', (ctrl.randomWords()[index].index + 1));
                    }
                });
            } catch (e) {
                m.flashError(e);
                return;
            }
            m.startComputation();
            ctrl.isSuccess(true);
            m.endComputation();
        };

        this.skip = function (e) {
            e.preventDefault();

            swal({
                title: Conf.tr("Warning!"),
                text: Conf.tr("Are you sure you want to skip the generation of mnemonic phrase? Without it, you will not be able to recover access to your funds in case of lost password"),
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: Conf.tr("Yes, skip it"),
                cancelButtonText: Conf.tr("Cancel"),
                allowOutsideClick: true,
                closeOnConfirm: true,
                html: false
            }, function(){
                m.route('/home');
            });
        }
    },

    view: function (ctrl, data) {
        if (ctrl.isSuccess()) return Wizard.view_success();
        return <div class="wrapper-page">
            <div class="row">
                <div class="col-lg-12">
                    <div class="panel panel-color panel-primary m-b-0">
                        <div class="panel-heading">
                            <h3 class="panel-title unselectable">{Conf.tr("Mnemonic phrase generation")}</h3>
                        </div>
                        <form role="form" onsubmit={ctrl.complete.bind(ctrl)}>
                            {ctrl.showWizardStage(ctrl, data)}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    },

    view_wizard_stage_blank: function (ctrl) {
        return <div>
            <div class="panel-body">
                <div class="tab-pane m-t-10 fade in" id="tab1">
                    <div class="row">
                        <div class="form-group clearfix" class="col-md-12">
                            <div><p class="text-danger">
                                <span class="dropcap text-danger">!</span>
                                {Conf.tr("Warning! Store your mnemonic phrase in a safe and private place. We do not recommend storing it on your computer or online. Anyone who has your mnemonic phrase will be able to get access to your funds.")}</p>
                            </div>
                        </div>
                    </div>
                    <div class="row m-t-15">
                        <div class="form-group clearfix" class="col-md-12">
                            <p class="text-success">
                                {Conf.tr("For your safety, print the blank phrase sheet and write your mnemonic phrase in it")}
                            </p>
                        </div>
                    </div>
                    <div class="row m-t-15">
                        <div class="form-group clearfix col-md-12 text-center">
                            <a class="btn btn-success waves-effect waves-light"
                               href={Conf.loc.userLanguage === 'en' ? "/assets/data/mnemonic-en.pdf" : "/assets/data/mnemonic-ua.pdf"}
                               download="mnemonic.pdf"> {Conf.tr("Download")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                <button
                    class='btn btn-warning waves-effect waves-light'
                    onclick={ctrl.skip.bind(ctrl)}>
                    {Conf.tr("Skip")}
                </button>

                <button
                    class='btn btn-primary waves-effect waves-light pull-right'
                    onclick={ctrl.doStep.bind(ctrl, 1)}>
                    {Conf.tr("Next")}
                </button>
            </div>
        </div>;
    },

    view_wizard_stage_words: function (ctrl, data) {
        var mnemonic = data.split(" ");
        var pages = Math.round(mnemonic.length / WORDS_PER_PAGE);
        m.startComputation();
        if (ctrl.wordsPage() != (pages-1)) ctrl.nextDisabled(true);
        m.endComputation();
        return <div>
            <div class="panel-body">
                <div class="tab-pane m-t-10 fade in" id="tab2">
                    <div class="row">
                        <div class="col-lg-12">
                            <p><i class="fa fa-pencil m-r-5"></i>
                                {Conf.tr("Use a pen to legibly write down the following $[1] words onto your printed phrase sheet. It is important that you write down the words exactly as they appear here and in this order.", mnemonic.length)}</p>
                        </div>
                    </div>
                    <div class="row m-t-15">
                        {mnemonic.map(function (word, index) {
                            if ((index >= (ctrl.wordsPage() * WORDS_PER_PAGE))
                                && (index < (ctrl.wordsPage() * WORDS_PER_PAGE + WORDS_PER_PAGE)))
                                return <div class="col-lg-6">
                                    {index + 1}. <b>{word}</b>
                                </div>
                        })}
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                {ctrl.wordsPage() < 1 ?
                    <button class='btn btn-default waves-effect waves-light'
                        onclick={ctrl.doStep.bind(ctrl, -1)}>
                        {Conf.tr("Back")}
                    </button>
                :
                    <button
                        class='btn btn-default waves-effect waves-light'
                        onclick={ctrl.doWordsStep.bind(ctrl, pages, -1)}>
                        {Conf.tr("Back")}
                    </button>
                }
                {ctrl.wordsPage() >= (pages-1) ?
                    <button class='btn btn-success waves-effect waves-light pull-right'
                            onclick={ctrl.doStep.bind(ctrl, 1)}>
                        {Conf.tr("Next")}
                    </button>
                :
                    <button
                        class='btn btn-primary waves-effect waves-light pull-right'
                        onclick={ctrl.doWordsStep.bind(ctrl, pages, 1)}>
                        {Conf.tr("Next")}
                    </button>
                }


            </div>
        </div>;
    },

    view_wizard_stage_check: function (ctrl, data) {
        var mnemonic = data.split(" ");
        var rndIndex = 0;
        if (!ctrl.randomWords().length) {
            var randomWords = [];
            for (var i = 0; i < WORDS_PER_PAGE; i++) {
                rndIndex = ctrl.getUniqueRandomIndex(mnemonic.length, randomWords);
                randomWords[i] = {
                    index: rndIndex,
                    word: mnemonic[rndIndex]
                };
            }
            randomWords.sort(function (a, b) {
                return a.index > b.index;
            });
            ctrl.randomWords(randomWords);
        }
        return <div>
            <div class="panel-body">
                <div class="tab-pane m-t-10 fade in" id="tab3">
                    <div class="row">
                        <div class="col-lg-12">
                            <p>{Conf.tr("Using the completed phrase sheet as a reference, please enter the following words from your mnemonic phrase to complete the registration process.")}</p>
                        </div>
                    </div>
                    <div class="form-group clearfix m-t-10">
                        <div class="form-horizontal">
                            {ctrl.randomWords().map(function (data, index) {
                                return <div class="form-group">
                                    <label class="col-md-1 control-label text-right">
                                        {data.index + 1}.
                                    </label>
                                    <div class="col-md-11">
                                        <input type="text" class="form-control phrase-control"
                                               name={"words"}
                                               id={"word_"+(index)}
                                               tabindex={(index+1)}
                                               onchange={m.withAttr("value", ctrl.setCheckWord.bind(ctrl, index))}
                                        />
                                    </div>
                                </div>
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                <button
                    class={'btn btn-default waves-effect waves-light'+((ctrl.mnemoWizardStage() < 1) ? ' disabled':'')}
                    onclick={ctrl.doStep.bind(ctrl, -1)}>
                    {Conf.tr("Back")}
                </button>
                <button class='btn btn-success waves-effect waves-light pull-right' type="submit">
                    {Conf.tr("Complete")}
                </button>
            </div>
        </div>;
    },

    view_success: function () {
        return <div class="wrapper-page">
            <div>
                <div class="panel panel-color panel-success">
                    <div class="panel-heading">
                        <h3 class="panel-title">{Conf.tr("Registration successful")}</h3>
                    </div>
                    <div class="panel-body">
                        <div class="text-center">
                            <p>{Conf.tr("Now you can recover your account with your mnemonic phrase.")}</p>
                            <br/>
                            <br/>
                            <a href="/" config={m.route}
                               class="btn btn-success btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Log in")}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
};