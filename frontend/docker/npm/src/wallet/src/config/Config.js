var Localize = require('localize');
var Locales = require('../locales/translations.js');
var trim = require('lodash.trim');

var smart_api = require('smart-api-js');

var conf = {
    master_key:         trim(process.env.MASTER_KEY),
    horizon_host:       trim(process.env.HORIZON_HOST, '/'),
    keyserver_host:     trim(process.env.KEYSERVER_HOST, '/'),
    api_host:           trim(process.env.API_HOST, '/'),
    info_host:          trim(process.env.INFO_HOST, '/'),
    exchange_host:      trim(process.env.EXCHANGE_HOST, '/'),
    help_url:           trim(process.env.HELP_URL, '/'),
    project_name:       process.env.PROJECT_NAME,
};

conf.SmartApi = new smart_api({
    host: process.env.API_HOST
});

conf.assets_url = 'assets';

conf.phone = {
    view_mask:  "+99 (999) 9999999",
    db_mask:    "999999999999",
    length:     10,
    prefix:     ""
};

conf.horizon = new StellarSdk.Server(conf.horizon_host);
conf.locales = Locales;

conf.payments = {
    onpage: 10
};

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

var Config = module.exports = conf;