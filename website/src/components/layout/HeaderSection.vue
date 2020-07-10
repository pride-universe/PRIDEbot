<template>
  <div class="header-section">
    <div class="header-wrapper">
      <router-link
        to="/"
        class="home-link"
      >
        <img
          class="home-link-image"
          alt="PrideBot logo"
          src="../../assets/logo.png"
        >
        <span class="home-link-text">PrideBot</span>
      </router-link>
      <div class="selector-wrapper">
        <server-selector />
      </div>
    </div>
  </div>
</template>

<script>

import ServerSelector from '../ServerSelector.vue';

export default {
  name: 'App',
  components: {
    ServerSelector,
  },
};
</script>

<style scoped>
.header-section {
  background-color: var(--background-tertiary);
  overflow: hidden;
}
.header-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 2rem;
  max-width: 1400px;
  margin: auto;
}
.header-wrapper > * {
  margin: 1rem 0;
}
.home-link {
  display: flex;
  align-items: center;
}
.selector-wrapper {
  min-width: 300px;
  display: flex;
  margin-left: 2rem;
}
.home-link-image {
  height: 72px;
  border-radius: 10px;
}
.home-link-text {
  margin-left: 1rem;
  font-size: 3em;
  color: var(--text-normal);
}
</style>
