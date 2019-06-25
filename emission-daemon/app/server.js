var config = require('./config'),
    errors = require('./inc/errors'),
    myerrors = require('./inc/innererrors'),
    colors = require('colors'),
    auth = require('basic-auth'),
    bodyParser = require('body-parser'),
    express = require('express'),
    prompt = require('prompt'),
    tools = require('./inc/tools'),
    StellarSdk = require('stellar-sdk');

var horizon;
var emission_key;

function innerError(error_type, error_code, error_text) {
    var e = new Error();
    e.innerType     = 'inner';
    e.type          = error_type;
    e.code          = error_code;
    e.msg           = error_text;

    throw e;
}

var app = express();

//CORS middleware
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('origin'));
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

    next();
});

app.get('/', function (req, res) {
    var apiExplorerData = {};
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    var emissionUrl = fullUrl + config.emission_path;

    apiExplorerData[emissionUrl] = {
        method: 'post',
        params: {
            accountId: {
                description: 'Distribution agent account ID',
                type: 'string',
                required: 'true'
            },
            amount: {
                description: 'Amount of emission in integer (example: for emission 1.00 EUAH amount parameter must be 100)',
                type: 'int',
                required: 'true'
            },
            asset: {
                description: 'Asset of emission',
                type: 'string',
                required: 'true'
            }
        },
        description: 'Emit money to distribution agent'
    };

    res.json(apiExplorerData);
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use('/' + config.emission_path, function(req, res, next) {

    if (req.method == 'OPTIONS') {
        res.end();
    }

    var user = auth(req);

    if (!user || user['name'] !== config.auth.user || user['pass'] !== config.auth.password) {
        console.log(colors.red('Unauthorized request'));

        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_UNAUTHORIZED, 'Unauthorized request');
    } else {
        next();
    }
});

app.post('/' + config.emission_path, function(req, res) {
    var dist_manager_account = req.body.accountId;
    var amount = req.body.amount;
    var asset  = req.body.asset;

    if (typeof dist_manager_account == 'undefined' || !dist_manager_account) {
        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_EMPTY_ACC_PARAM, '[accountId] param is empty');
    }

    if (!StellarSdk.Keypair.isValidPublicKey(dist_manager_account)) {
        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_BAD_ACC_PARAM, '[accountId] param is invalid');
    }

    if (typeof amount == 'undefined' || !amount) {
        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_EMPTY_AMOUNT_PARAM, '[amount] param is empty');
    }

    // Check positive document amount
    if (amount >>> 0 !== parseFloat(amount)) {
        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_BAD_AMOUNT_PARAM, '[amount] param is not a positive int');
    }

    if (typeof asset == 'undefined' || !asset.length) {
        return errorResponse(res, errors.TYPE_NATIVE, errors.ERR_EMPTY_ASSET_PARAM, '[asset] param is empty');
    }

    var setted_limits = {
        daily: -1,
        monthly: -1
    };

    // Load agent account
    horizon.loadAccount(dist_manager_account)
        // get account info
        .then(account => {
            return horizon.accounts().accountId(account._accountId).call()
        })
        // verify agent type
        .then(function(accountDetails) {
            if(accountDetails.type_i != StellarSdk.xdr.AccountType.accountDistributionAgent().value){
                return innerError(errors.TYPE_STELLAR, errors.ERR_BAD_AGENT, 'BAD AGENT TYPE');
            }
        })
        // get agent traits
        .then(function() {
            return horizon.accounts().traits(dist_manager_account).call();
        })
        //check agent incoming restrictions
        .then(function (traits) {
            if (traits.block_incoming_payments == true) {
                return innerError(errors.TYPE_STELLAR, errors.OP_BLOCKED, 'OPERATION BLOCK');
            }
        })
        // get limits
        .then(function() {
            return horizon.accounts().limits(dist_manager_account).call();
        })
        // check incoming operation limit
        .then(function(limits_data) {

            if (typeof limits_data.limits != 'undefined' && limits_data.limits.length > 0) {

                var limits = limits_data.limits;

                Object.keys(limits).forEach(function(key) {
                    if (limits[key].asset_code == asset) {

                        //-1 is no limit
                        if(limits[key].max_operation_in > -1) {
                            if (limits[key].max_operation_in < amount) {
                                return innerError(errors.TYPE_STELLAR, errors.ERR_MAX_OPERATION_LIMIT, 'MAX OPERATION LIMIT IS EXCEEDED');
                            }
                        }

                        setted_limits.daily   = limits[key].daily_max_in*1;
                        setted_limits.monthly = limits[key].monthly_max_in*1;
                    }
                });

            }
        })
        //get statistic
        .then(function() {
            return horizon
                .accounts()
                .statisticsForAccount(dist_manager_account)
                .call();
        })
        // check statistic
        .then(function(statistic_data) {

            var used_limits = {
                daily: 0,
                monthly: 0
            };

            if (typeof statistic_data.statistics != 'undefined' && statistic_data.statistics.length > 0) {

                var stats = statistic_data.statistics;

                Object.keys(stats).forEach(function (key) {
                    if (stats[key].asset_code == asset) {
                        used_limits.daily   += stats[key].income.daily*1;
                        used_limits.monthly += stats[key].income.monthly*1;
                    }
                });

            }

            //if daily limit setted for agent
            if (setted_limits.daily > -1) {
                if (setted_limits.daily < used_limits.daily + amount) {
                    //daily limit is EXCEEDED
                    return innerError(errors.TYPE_STELLAR, errors.ERR_DAILY_OPERATION_LIMIT, 'DAILY OPERATION LIMIT IS EXCEEDED');
                }
            }

            //if monthly limit setted for agent
            if (setted_limits.monthly > -1) {
                if (setted_limits.monthly < used_limits.monthly + amount) {
                    //monthly limit is EXCEEDED
                    return innerError(errors.TYPE_STELLAR, errors.ERR_MONTHLY_OPERATION_LIMIT, 'MONTHLY OPERATION LIMIT IS EXCEEDED');
                }
            }

        })
        // Load bank account
        .then(() => {
            return horizon.loadAccount(config.master_key)
        })
        // Issue some money
        .then(source => {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.payment({
                    destination: dist_manager_account,
                    amount: parseFloat(amount/100).toFixed(2).toString(),
                    asset: new StellarSdk.Asset(asset, source.accountId())
                }))
                .build();

            tx.sign(emission_key);
            return horizon.submitTransaction(tx)
        })
        .then(tx => {
            res.status(200).json({
                tx_hash: tx.hash
            });
        })
        .catch (err => {
            console.log(err);
            if(typeof err.innerType != 'undefined' && err.innerType == 'inner'){
                return errorResponse(res, err.type, err.code, err.msg);
            } else {

                var err_type = 'unknown';

                if (typeof err.message != 'undefined') {
                    if (typeof err.message.type != 'undefined') {
                        err_type = err.message.type;
                    }
                }

                outerError = myerrors.getProtocolError(err_type);
                return errorResponse(res, outerError.type, outerError.code, outerError.msg);
            }
        })
});

prompt.start();
prompt.get({
    description: 'Enter mnemonic phrase of emission key',
    name: 'key',
    hidden: true,
}, function(err, result) {
    try {
        var seed = StellarSdk.getSeedFromMnemonic(result.key);
    } catch (err) {
        return console.error(colors.red(err));
    }
    if (!seed) {
        console.error(colors.red('CAN NOT GET SEED! Shutting down...'));
    }
    horizon = new StellarSdk.Server(config.horizon_url);
    emission_key = StellarSdk.Keypair.fromSeed(seed);
    horizon.accounts().accountId(config.master_key).call()
        .then(function (master) {
            var is_signed = false;
            if (typeof master.signers != 'undefined') {
                master.signers.forEach(function (signer) {
                    if (signer.weight == StellarSdk.xdr.SignerType.signerEmission().value &&
                        signer.public_key == emission_key.accountId()
                    ) {
                        is_signed = true;
                    }
                });
            }
            return is_signed;
        })
        .then(function (is_signed) {
            if (!is_signed) {
                return console.error(colors.red('ERROR: BAD ACCOUNT TYPE'));
            }
            horizon.loadAccount(config.master_key)
                .then(source => {
                    app.listen(config.app.port);
                    console.log(colors.green('Listening on port ' + config.app.port));
                }, err => {
                    console.log(colors.red('Cannot load bank_account from Stellar'));
                });
        });
});

function errorResponse(res, type, code, msg) {
    return res.status(400).json({
        err_msg: typeof msg == 'undefined'? '' : msg,
        err_type: type,
        err_code: code
    });
}