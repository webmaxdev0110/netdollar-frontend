var Localize = require('localize');
var Locales = require('../locales/translations.js');

var conf = {
    horizon_host: process.env.HORIZON_HOST,
    master_public_key: process.env.MASTER_KEY,
    stellar_network: process.env.STELLAR_NETWORK,
    //project_name: process.env.PROJECT_NAME,
    project_name: '',
    merchant_prefix: 'mo:',
    copyright_link: 'http://atticlab.net'
};

conf.limit = 25;

var resizefunc = [];

StellarSdk.Network.use(new StellarSdk.Network(conf.stellar_network));
conf.horizon = new StellarSdk.Server(conf.horizon_host);

conf.locales = Locales;

conf.loc = new Localize(conf.locales);
conf.loc.throwOnMissingTranslation(false);
conf.loc.userLanguage = (localStorage.getItem('locale')) ? (localStorage.getItem('locale')) :
    (navigator.language || navigator.userLanguage).toLowerCase().split('-')[0];
conf.loc.setLocale(conf.loc.userLanguage);
conf.loc.changeLocale = function (locale, e) {
    e.preventDefault();
    m.startComputation();
    conf.loc.setLocale(locale);
    localStorage.setItem('locale', locale);
    m.endComputation();
};
conf.tr = conf.loc.translate; //short alias for translation

conf.logo_src = conf.loc.userLanguage === 'ua' ? 'logo-white-ua.svg' : 'logo-white.svg';

var errors = require('../errors/Errors');
conf.errors = errors;

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
};

var Config = module.exports = conf;
