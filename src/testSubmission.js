import Vue from 'vue';
import TestSubmissionPage from './pages/TestSubmissionPage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        TestSubmissionPage,
    },
});
