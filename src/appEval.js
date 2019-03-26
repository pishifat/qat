import Vue from 'vue';
import AppEvalPage from './pages/AppEvalPage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        AppEvalPage,
    },
});
