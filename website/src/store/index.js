import Vue from 'vue';
import Vuex from 'vuex';

import api from '../api';

Vue.use(Vuex);

let refreshPromise = null;

const store = new Vuex.Store({
  state: {
    authToken: window.localStorage.getItem('authToken'),
  },
  mutations: {
    clearAuth(state) {
      window.localStorage.removeItem('authToken');
      api.defaults.headers = Object.assign(
        api.defaults.headers || {},
        { Authorization: null },
      );
      state.authToken = null;
    },
    setAuth(state, auth) {
      window.localStorage.setItem('authToken', auth);
      api.defaults.headers = Object.assign(
        api.defaults.headers || {},
        { Authorization: auth ? `Bearer ${auth}` : null },
      );
      state.authToken = auth;
    },
  },
  actions: {
    async refreshToken(context) {
      if (!refreshPromise) {
        refreshPromise = api.get('/refresh').then(({ data }) => {
          refreshPromise = null;
          if (context.state.authToken === store.state.authToken) {
            context.commit('setAuth', data.payload.token);
          } else {
            console.warn('Not changing token, conflict');
          }
        }, (err) => {
          refreshPromise = null;
          if (context.state.authToken === store.state.authToken) {
            context.commit('clearAuth');
          } else {
            console.warn('Not changing token, conflict');
          }
          throw err;
        });
      }
      await refreshPromise;
    },
  },
});

api.defaults.headers = Object.assign(
  api.defaults.headers || {},
  { Authorization: store.state.authToken ? `Bearer ${store.state.authToken}` : null },
);

window.addEventListener('storage', ({ key, newValue }) => {
  console.log('storage event');
  if (key == null && newValue == null) {
    console.log('clear');
    store.commit('clearAll');
  } else if (key === 'authToken') {
    if (newValue == null) {
      console.log('clearAuth');
      store.commit('clearAuth');
    } else {
      console.log('setAuth');
      store.commit('setAuth', newValue);
    }
  }
});

export default store;
