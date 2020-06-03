import Vue from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt('zero', {
    html: false,
    breaks: true,
    linkify: true,
    typographer: false,
}).enable(['emphasis', 'linkify', 'newline']);

Vue.prototype.$md = md;

$(document).ready(function() {
    ($('body')).tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});
