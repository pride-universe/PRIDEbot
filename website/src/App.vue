<template>
  <div id="app">
    <header-section />
    <div class="page-wrapper">
      <router-view />
    </div>
    <footer-section />
  </div>
</template>

<script>

import HeaderSection from './components/layout/HeaderSection.vue';
import FooterSection from './components/layout/FooterSection.vue';

export default {
  name: 'App',
  components: {
    HeaderSection,
    FooterSection,
  },
};
</script>

<style>
#app {
  text-align: center;
  color: var(--text-normal);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page {
  padding: 8px;
  max-width: 1400px;
  margin: auto;
}
.page-wrapper {
  flex-grow: 1;
}
</style>
