const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'webhooks.json');

/** @type {Record<string, unknown>} */
let cachedConfig = {};

/**
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadFromDisk() {
    try {
        const raw = await fs.readFile(CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            console.warn('[webhookConfig] webhooks.json must contain a JSON object; using empty config');
            return {};
        }

        return parsed;
    } catch (e) {
        if (e && e.code === 'ENOENT') {
            console.warn('[webhookConfig] webhooks.json not found; using empty config');
        } else if (e instanceof SyntaxError) {
            console.warn('[webhookConfig] webhooks.json is not valid JSON; using empty config:', e.message);
        } else {
            console.warn('[webhookConfig] Failed to read webhooks.json; using empty config:', e.message);
        }

        return {};
    }
}

async function init() {
    cachedConfig = await loadFromDisk();
}

async function reload() {
    cachedConfig = await loadFromDisk();
}

function get() {
    return cachedConfig;
}

/**
 * @param {string} webhook
 * @param {string} id
 * @param {string} token
 */
async function update(webhook, id, token) {
    const prev =
        cachedConfig[webhook] && typeof cachedConfig[webhook] === 'object'
            ? cachedConfig[webhook]
            : {};

    const merged = {
        ...prev,
        id,
        token,
    };

    const nextConfig = {
        ...cachedConfig,
        [webhook]: merged,
    };

    await fs.writeFile(CONFIG_PATH, JSON.stringify(nextConfig, null, 4), 'utf8');
    cachedConfig = nextConfig;
}

module.exports = {
    init,
    reload,
    get,
    update,
};
