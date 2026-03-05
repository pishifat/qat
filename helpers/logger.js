/**
 * Console styles
 */

const stylesCodes = {
    // Colors
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    orange: '\x1b[38;5;208m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',

    // Modifiers
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
};

/**
 * Applies multiple styles to text
 * @param text The text to style
 * @param styles Array of styles to apply
 * @example
 * consoleStyles('Hello World', ['cyan', 'underline'])
 * consoleStyles('Error message', ['red', 'italic'])
 */
function consoleStyles(text, styleNames) {
    const codes = styleNames.map((name) => {
        if (!(name in stylesCodes)) {
            throw new Error(`Invalid style name: ${name}`);
        }

        return stylesCodes[name];
    });

    return `${codes.join('')}${text}${stylesCodes.reset}`;
}

const morgan = require('morgan');
const moment = require('moment');

morgan.token('time-colored', () => consoleStyles(moment().format('YYYY-MM-DD HH:mm:ss.SSS'), ['dim']));

morgan.token('method-colored', (req) => {
    const method = req.method;
    const methodColorMap = {
        GET: ['green'],
        POST: ['cyan'],
        PUT: ['yellow'],
        PATCH: ['orange'],
        DELETE: ['red'],
    };
    const style = methodColorMap[method] || ['dim'];

    return consoleStyles(method, style);
});

morgan.token('status-colored', (req, res) => {
    const status = res.statusCode;
    // Map status code ranges to styles
    const statusColorMap = [
        { range: [500, 599], style: ['red'] },
        { range: [400, 499], style: ['orange'] },
        { range: [300, 399], style: ['cyan'] },
        { range: [200, 299], style: ['green'] },
        { range: [100, 199], style: ['dim'] },
    ];
    const match = statusColorMap.find(({ range }) => status >= range[0] && status <= range[1]);
    const style = match ? match.style : ['dim'];

    return consoleStyles(status.toString(), style);
});

morgan.token('username-colored', (req, res) => {
    const username = req.session.username || 'Unknown';

    return consoleStyles(username, username === 'Unknown' ? ['dim'] : ['cyan', 'dim']);
});

morgan.token('ip-colored', (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'Unknown IP';

    return consoleStyles(ip, ip === 'Unknown IP' ? ['dim'] : ['orange', 'dim']);
});

logger = morgan(
    `:time-colored — :method-colored ${consoleStyles(':url', [
        'yellow',
        'bold',
    ])} :status-colored — :username-colored — :ip-colored — ${consoleStyles(':response-time ms', [
        'magenta',
    ])}`
);

module.exports = logger;