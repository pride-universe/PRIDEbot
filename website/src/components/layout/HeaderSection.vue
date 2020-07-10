<template>
  <div class="header-section">
    <div class="header-wrapper">
      <span
        to="/"
        class="logo-section"
      >
        <router-link
          to="/"
          class="home-link-image"
        >
          <img
            alt="PrideBot logo"
            src="../../assets/logo.png"
          >
        </router-link>
        <div class="logo-section-after">
          <router-link
            to="/"
            class="home-link-text"
          >
            PrideBot
          </router-link>
          <login-button class="user-button" />
        </div>
      </span>
      <div class="selector-wrapper">
        <server-selector />
      </div>
    </div>
  </div>
</template>

<script>

import ServerSelector from '../ServerSelector.vue';
import LoginButton from '../LoginButton.vue';

export default {
  name: 'App',
  components: {
    ServerSelector,
    LoginButton,
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
  justify-content: flex-start;
  padding: 0 2rem;
  margin: auto;
  max-width: 1400px;
  flex: 1 1;
}
.user-button {
  flex: 0 0;
}
.header-wrapper > * {
  margin: 1rem 0;
}
.logo-section {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
}
.logo-section-after {
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}
.selector-wrapper {
  min-width: 100px;
  display: flex;
  margin-left: 2rem;
}
.home-link-image {
  margin: auto;
}
.home-link-image > img {
  height: 72px;
  border-radius: 10px;
}
.home-link-text {
  font-size: 2em;
  color: var(--text-normal);
}
</style>
