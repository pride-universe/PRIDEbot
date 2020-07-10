import Vue from 'vue';
import VueRouter from 'vue-router';
import api from './api';

import store from './store';

import Index from './routes/Index.vue';
import RolePicker from './routes/RolePicker.vue';
import Oauth2 from './routes/Oauth2.vue';
import NotFound from './routes/NotFound.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', component: Index },
  { path: '/r/:id', component: RolePicker },
  {
    path: '/oauth2',
    beforeEnter: async (to, from, next) => {
      if (to.query.code) {
        api.post('/token', { code: to.query.code }).then(({ data }) => {
          store.commit('setAuth', data.payload.token);
          return next(to.query.state || '/');
        }).catch((err) => { console.error(err); next(); });
      } else {
        next();
      }
    },
    component: Oauth2,
  },
  { path: '*', component: NotFound },
];

export default new VueRouter({
  mode: 'history',
  routes,
});
