const express = require('express');
const axios = require('axios');
const dns = require('dns').promises;

const router = express.Router();

const ALLOWED_CONTENT_TYPES = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml|bmp|ico|tiff)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 5000;

const PRIVATE_IP_RANGES = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^fd/i,
];

function isPrivateIP(ip) {
    return PRIVATE_IP_RANGES.some(range => range.test(ip));
}

async function resolveHostToIP(hostname) {
    try {
        const addresses = await dns.resolve4(hostname);

        return addresses[0];
    } catch {
        try {
            const addresses = await dns.resolve6(hostname);

            return addresses[0];
        } catch {
            return null;
        }
    }
}

/* GET proxy image */
router.get('/image', async (req, res) => {
    const encodedUrl = req.query.url;

    if (!encodedUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    let originalUrl;

    try {
        originalUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    } catch {
        return res.status(400).json({ error: 'Invalid base64 encoding' });
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(originalUrl);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ error: 'Only http and https protocols are allowed' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return res.status(400).json({ error: 'Access to localhost is not allowed' });
    }

    const resolvedIP = await resolveHostToIP(hostname);

    if (resolvedIP && isPrivateIP(resolvedIP)) {
        return res.status(400).json({ error: 'Access to private IP ranges is not allowed' });
    }

    try {
        const response = await axios.get(originalUrl, {
            responseType: 'arraybuffer',
            timeout: TIMEOUT_MS,
            maxContentLength: MAX_FILE_SIZE,
            maxBodyLength: MAX_FILE_SIZE,
            headers: {
                'User-Agent': 'BN-Site-Image-Proxy/1.0',
                'Accept': 'image/*',
            },
            validateStatus: status => status === 200,
        });

        const contentType = response.headers['content-type'];

        if (!contentType || !ALLOWED_CONTENT_TYPES.test(contentType.split(';')[0].trim())) {
            return res.status(400).json({ error: 'Response is not a valid image' });
        }

        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff',
        });

        res.send(Buffer.from(response.data));
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'Request timed out' });
        }

        if (error.response) {
            return res.status(502).json({ error: `Remote server returned ${error.response.status}` });
        }

        return res.status(502).json({ error: 'Failed to fetch image' });
    }
});

module.exports = router;
