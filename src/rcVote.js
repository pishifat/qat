import Vue from 'vue';
import RcVotePage from './pages/RcVotePage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        RcVotePage,
    },
});
