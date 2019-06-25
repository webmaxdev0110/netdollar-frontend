var config = {};

config.app = {
    port: 5050
};

config.auth = {
    user: "username",
    password: "password"
};

config.emission_path = process.env.EMISSION_PATH;
config.horizon_url = process.env.HORIZON_HOST;
config.master_key = process.env.MASTER_KEY;

module.exports = config;