import Vue from 'vue';
import TestResultsPage from './pages/TestResultsPage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        TestResultsPage,
    },
});
