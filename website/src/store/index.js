import Vue from 'vue';
import Vuex from 'vuex';

// eslint-disable-next-line no-unused-vars
import api, { DISCORD_API } from '../api';

Vue.use(Vuex);

let refreshPromise = null;

const store = new Vuex.Store({
  state: {
    authToken: window.localStorage.getItem('authToken'),
    user: null,
  },
  mutations: {
    clearAuth(state) {
      window.localStorage.removeItem('authToken');
      api.defaults.headers = Object.assign(
        api.defaults.headers || {},
        { Authorization: null },
      );
      state.authToken = null;
      store.dispatch('getMe');
    },
    setAuth(state, auth) {
      window.localStorage.setItem('authToken', auth);
      api.defaults.headers = Object.assign(
        api.defaults.headers || {},
        { Authorization: auth ? `Bearer ${auth}` : null },
      );
      state.authToken = auth;
      store.dispatch('getMe');
    },
    setUser(state, user) {
      state.user = user;
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
    async getMe(context) {
      if (!context.state.authToken) {
        context.commit('setUser', null);
        return;
      }
      try {
        const { access_token: accessToken } = JSON.parse(window.atob(context.state.authToken.split('.')[1]));
        context.commit('setUser', (await api.get('/users/@me', {
          baseURL: DISCORD_API,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })).data);
      } catch (err) {
        context.commit('setUser', null);
        console.error(err);
      }
    },
    async signOut(context) {
      if (!context.state.authToken) {
        return;
      }
      try {
        await api.post('/logout');
      } catch (err) {
        console.error(err);
      }
      context.commit('clearAuth');
    },
  },
});

api.defaults.headers = Object.assign(
  api.defaults.headers || {},
  { Authorization: store.state.authToken ? `Bearer ${store.state.authToken}` : null },
);

store.dispatch('getMe');

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
