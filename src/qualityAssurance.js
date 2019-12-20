import Vue from 'vue';
import QualityAssurancePage from './pages/QualityAssurancePage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        QualityAssurancePage,
    },
});
