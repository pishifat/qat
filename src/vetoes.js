import Vue from 'vue';
import VetoesPage from './pages/VetoesPage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        VetoesPage,
    },
});
