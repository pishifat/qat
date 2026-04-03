import MarkdownIt from 'markdown-it';
import moment from 'moment';
import MarkdownItVideo from 'markdown-it-video';
import osuTimestamps from './plugins/markdown-it-osu-timestamps';
import markdownItHexColor from './plugins/markdown-it-hex-color';
import $ from 'jquery';
import { Modal, Tooltip } from 'bootstrap';

// Make jQuery available globally
window.$ = window.jQuery = $;

$.fn.modal = function (action) {
    this.each(function () {
        if (action === 'show') {
            Modal.getOrCreateInstance(this).show();
        } else if (action === 'hide') {
            Modal.getOrCreateInstance(this).hide();
        }
    });

    return this;
};

export const md = new MarkdownIt('default', {
    html: false,
    breaks: true,
    linkify: true,
    typographer: false,
    highlight: null,
})
    .enable(['emphasis', 'linkify', 'newline', 'link', 'image', 'heading', 'list', 'hr', 'code'])
    .disable(['lheading'])
    .use(osuTimestamps, { wrapInCode: true })
    .use(MarkdownItVideo)
    .use(markdownItHexColor);

const UNSAFE_PROTOCOL_RE = /^(javascript|vbscript|file|data):/i;
md.validateLink = (url) => !UNSAFE_PROTOCOL_RE.test(url);

export function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;

    try {
        const parsed = new URL(url);

        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

export function sanitizeUrlForCss(url) {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return null;

    return safeUrl.replace(/[()'"\\]/g, '\\$&');
}

export function proxyUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (!/^https?:\/\//i.test(url)) return null;

    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}

// Remember old renderer, if overridden, or proxy to default renderer
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    let aIndex = token.attrIndex('target');

    if (aIndex < 0) {
        token.attrPush(['target', '_blank']);
    } else {
        token.attrs[aIndex][1] = '_blank';
    }

    aIndex = token.attrIndex('rel');
    if (aIndex < 0) {
        token.attrPush(['rel', 'noopener noreferrer']);
    } else {
        token.attrs[aIndex][1] = 'noopener noreferrer';
    }

    return defaultRender(tokens, idx, options, env, self);
};

// Proxy external images to prevent IP leakage
const defaultImageRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');

    if (srcIndex >= 0 && !env?.skipImageProxy) {
        const proxied = proxyUrl(token.attrs[srcIndex][1]);

        if (proxied) {
            token.attrs[srcIndex][1] = proxied;
        }
    }

    const relIndex = token.attrIndex('referrerpolicy');
    if (relIndex < 0) {
        token.attrPush(['referrerpolicy', 'no-referrer']);
    } else {
        token.attrs[relIndex][1] = 'no-referrer';
    }

    return defaultImageRender(tokens, idx, options, env, self);
};

// locale for short dates
moment.defineLocale('short', {
    parentLocale: 'en',
    relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: '1s',
        ss: '%ds',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1mo',
        MM: '%dmo',
        y: '1y',
        yy: '%dy',
    },
});

function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        if (!Tooltip.getInstance(el)) {
            new Tooltip(el, { trigger: 'hover' });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    new MutationObserver(initTooltips).observe(document.body, { childList: true, subtree: true });
});
