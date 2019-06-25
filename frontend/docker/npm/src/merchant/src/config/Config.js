var Localize = require('localize');
var Locales = require('../locales/translations.js');
var smart_api = require('smart-api-js');

var conf = {
    master_key:         process.env.MASTER_KEY,
    horizon_host:       process.env.HORIZON_HOST,
    api_url:            process.env.API_HOST,
    project_name:       process.env.PROJECT_NAME,
    roles: {
        admin   : 1,
        emission: 2
    }
};

conf.SmartApi = new smart_api({
    host: process.env.API_HOST
});

conf.statuses = {
    STATUS_WAIT_PAYMENT: 1, //create order record in db, wait payment
    STATUS_WAIT_ANSWER: 2, //payment complete, wait answer from merchant domain
    STATUS_PARTIAL_PAYMENT: 3, //amount of payment is less than amount of order
    STATUS_FAIL: 4,
    STATUS_SUCCESS: 5
};

conf.phone = {
    view_mask:  "+99 (999) 999-99-99",
    db_mask:    "999999999999",
    length:     10,
    prefix:     "+38"
};

conf.horizon = new StellarSdk.Server(conf.horizon_host);

conf.locales = Locales;

conf.payments = {
    onpage: 10
};

conf.pagination = {
    limit: 10
};

conf.payment_prefix = 'mo:';
conf.payment_type   = 1;

conf.loc = new Localize(conf.locales);
conf.loc.throwOnMissingTranslation(false);
conf.loc.userLanguage = (localStorage.getItem('locale')) ? (localStorage.getItem('locale')) :
    (navigator.language || navigator.userLanguage).toLowerCase().split('-')[0];
conf.loc.setLocale(conf.loc.userLanguage);
conf.current_language = conf.loc.userLanguage;
conf.mnemonic = {langsList: ['eng', 'ukr']};
conf.mnemonic.locale = (conf.loc.userLanguage == 'en') ? 'eng' : 'ukr';
conf.loc.changeLocale = function (locale, e) {
    e.preventDefault();
    m.startComputation();
    conf.loc.setLocale(locale);
    conf.current_language = locale;
    conf.mnemonic.locale = (locale == 'en') ? 'eng' : 'ukr';
    localStorage.setItem('locale', locale);
    m.endComputation();
};
conf.tr = conf.loc.translate; //short alias for translation

conf.mnemonic.totalWordsCount = 24;

var errors = require('../errors/Errors');
conf.errors = errors;

var Config = module.exports = conf;
