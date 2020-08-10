import Vue from 'vue';
import MarkdownIt from 'markdown-it';
import moment from 'moment';

const md = new MarkdownIt('zero', {
    html: false,
    breaks: true,
    linkify: true,
    typographer: false,
}).enable(['emphasis', 'linkify', 'newline', 'link', 'image']);

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

Vue.filter('toStandardDate', (date) => {
    if (!date) return '';

    return moment(date).format('YYYY-MM-DD');
});

Vue.filter('toMonthDay', (date) => {
    if (!date) return '';

    return moment(date).format('MMM DD');
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

$(document).ready(function() {
    ($('body')).tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});
