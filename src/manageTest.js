import Vue from 'vue';
import ManageTestPage from './pages/ManageTestPage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        ManageTestPage,
    },
});
