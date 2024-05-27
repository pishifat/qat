import Vue from 'vue';
import MarkdownIt from 'markdown-it';
import moment from 'moment';
import MarkdownItVideo from 'markdown-it-video';
import http from './store/http';
import osuTimestamps from './plugins/markdown-it-osu-timestamps';

const md = new MarkdownIt('default', {
    html: false,
    breaks: true,
    linkify: true,
    typographer: false,
    highlight: null,
})
    .enable(['emphasis', 'linkify', 'newline', 'link', 'image', 'heading', 'list', 'hr', 'code'])
    .disable(['lheading'])
    .use(osuTimestamps)
    .use(MarkdownItVideo);

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

Vue.prototype.$md = md;
Vue.prototype.$moment = moment;
Vue.prototype.$http = http;

Vue.filter('toStandardDate', (date) => {
    if (!date) return '';

    return moment(date).format('YYYY-MM-DD');
});

Vue.filter('toMonthDayYear', (date) => {
    if (!date) return '';

    return moment(date).format('MMM DD, YYYY');
});

Vue.filter('toStandardDetailedDate', (date) => {
    if (!date) return '';

    return moment(date).format('YYYY-MM-DD hh:mm:ss A');
});

Vue.filter('toRelativeDate', (date) => {
    if (!date) return '';

    return moment(date).fromNow();
});

Vue.filter('shorten', (text, length) => {
    if (!text) return '';

    length = length || 90;

    if (text.length > length) {
        return text.toString().slice(0, length) + '...';
    } else {
        return text;
    }
});

Vue.filter('formatMode', (mode) => {
    if (!mode) return '';

    if (mode == 'none') return 'structural';
    else if (mode == 'osu') return 'osu!';
    else return 'osu!' + mode;
});

$(document).ready(function() {
    ($('body')).tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});
