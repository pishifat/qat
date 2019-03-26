import Vue from 'vue';
import ManageReportsPage from './pages/ManageReportsPage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        ManageReportsPage,
    },
});
