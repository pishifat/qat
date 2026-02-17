const fs = require('fs');

let cachedConfig = load();

function load() {
    const config = JSON.parse(fs.readFileSync('webhooks.json', 'utf8'));

    return config;
}

function reload() {
    cachedConfig = load();
}

function get() {
    return cachedConfig;
}

/**
 * @param {string} webhook
 * @param {string} id
 * @param {string} token
 */
function update(webhook, id, token) {
    cachedConfig[webhook] = {
        id,
        token,
    };

    fs.writeFileSync('webhooks.json', JSON.stringify(cachedConfig, null, 4));
}

module.exports = {
    reload,
    get,
    update,
};
