import Vue from 'vue';
import UsersPage from './pages/UsersPage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        UsersPage,
    },
});
