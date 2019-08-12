import Vue from 'vue';
import EvalArchivePage from './pages/EvalArchivePage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        EvalArchivePage,
    },
});
