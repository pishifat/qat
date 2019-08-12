import Vue from 'vue';
import DataCollectionPage from './pages/DataCollectionPage.vue';

$(document).ready(function() {
    $('body').tooltip({ selector: '[data-toggle=tooltip]', trigger: 'hover' });
});

new Vue({
    el: '#app',
    components: {
        DataCollectionPage,
    },
});
