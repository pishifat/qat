import './sass/app.scss';
import './bootstrap';
import Vue from 'vue';
import ModRequests from './pages/ModRequests.vue';

new Vue({
    render: h => h(ModRequests),
}).$mount('#app');
