import Vue from 'vue';
import QatUsersPage from './pages/QatUsersPage.vue';

$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover', });
});

new Vue({
    el: '#app',
    components: {
        QatUsersPage,
    },
});
