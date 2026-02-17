import MarkdownIt from 'markdown-it';
import moment from 'moment';
import MarkdownItVideo from 'markdown-it-video';
import osuTimestamps from './plugins/markdown-it-osu-timestamps';
import MarkdownItColor from 'markdown-it-color';
import $ from 'jquery';
import 'bootstrap';

// Make jQuery available globally
window.$ = window.jQuery = $;

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
    .use(MarkdownItColor, { inline: true });

// Remember old renderer, if overridden, or proxy to default renderer
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    let aIndex = tokens[idx].attrIndex('target');

    if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']);
    } else {
        tokens[idx].attrs[aIndex][1] = '_blank';
    }

    return defaultRender(tokens, idx, options, env, self);
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

$(document).ready(function() {
    ($('body')).tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});
