var Handler = require('./inc/Handler');
var Helpers = require('./inc/Helpers');
var Conf = require('./config');
var prompt = require('prompt');
var Riak = require('basho-riak-client');

Conf.horizon.transactions()
    .cursor('now')
    .stream({
        onmessage: function (transaction) {
            //if tx is for merchant
            if (Helpers.getMerchantOrderIDFromMemo(transaction.memo)) {
                return connection()
                    .then(function (client) {
                        if (client) {
                            Handler(transaction, client);
                        }
                    })
                    .catch(function (err) {
                        Conf.log.error(JSON.stringify(err));
                    })
            }
        },
        onerror: function (error) {
            Conf.log.error('horizon stream error');
            Conf.log.error(JSON.stringify(error));
        }
    });

function connection() {
    // for cluster with auth
    // var cluster = buildCluster(Conf.riak_nodes, Conf.riak_options.auth.user, Conf.riak_options.auth.pass);

    // for cluster without auth
    var cluster = buildCluster(Conf.riak_nodes);

    return new Promise(function (resolve, reject) {
        new Riak.Client(cluster, function (err, client) {
            if (err) {
                Conf.log.error('Riak connection error');
                Conf.log.error(JSON.stringify(err));
                return reject(false);
            }
            client.ping(function (err, rslt) {
                if (err || rslt !== true) {
                    Conf.log.error('Error while trying to ping riak client');
                    Conf.log.error(JSON.stringify(err));
                    return reject(false);
                }
                Conf.log.info('TX handling started. Connection opened...');
                return resolve(client);
            });

        });
    });
}
function buildCluster(nodes, user, pass) {
    //with auth
    if (user && pass) {
        var riak_nodes = Riak.Node.buildNodes(nodes, {
            auth: {
                user: user,
                password: pass
            }
        });
        return new Riak.Cluster({nodes: riak_nodes});
    } else {
        //without auth
        return nodes;
    }
}