<template>
  <div id="app">
    <header-section />
    <router-view />
  </div>
</template>

<script>

import HeaderSection from './components/layout/HeaderSection.vue';

export default {
  name: 'App',
  components: {
    HeaderSection,
  },
};
</script>

<style>
#app {
  text-align: center;
  color: var(--text-normal);
}
.page {
  padding: 8px;
  max-width: 1400px;
  margin: auto;
}
</style>
