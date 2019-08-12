import Vue from 'vue';
import BnEvalPage from './pages/BnEvalPage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        BnEvalPage,
    },
});
