import Vue from 'vue';
import DiscussionVotePage from './pages/DiscussionVotePage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        DiscussionVotePage,
    },
});
