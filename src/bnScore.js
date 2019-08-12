import Vue from 'vue';
import BnScorePage from './pages/BnScorePage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        BnScorePage,
    },
});
