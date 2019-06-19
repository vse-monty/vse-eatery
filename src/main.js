import Vue from 'vue';
import './plugins/vuetify';
//import './plugins/socketIO';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;
Vue.config.devtools = true;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
