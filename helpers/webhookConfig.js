const fs = require('fs');

let cachedConfig = loadConfig();

function loadConfig() {
    const config = JSON.parse(fs.readFileSync('webhooks.json', 'utf8'));
    return config;
}

function reloadConfig() {
    cachedConfig = loadConfig();
}

function getConfig() {
    return cachedConfig;
}

function updateConfig(webhook, id, token) {
    cachedConfig[webhook] = {
        id,
        token
    };

    fs.writeFileSync('webhooks.json', JSON.stringify(cachedConfig, null, 4));
}

module.exports = {
    reloadConfig,
    getConfig,
    updateConfig
};
