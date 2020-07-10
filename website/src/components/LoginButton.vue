<template>
  <button
    v-if="!$store.state.authToken"
    type="button"
    class="login-button"
    @click="signIn"
  >
    <span>Sign in with</span>
    <img
      src="../assets/discord-logo.svg"
      alt="Discord"
    >
  </button>
  <button
    v-else
    type="button"
    class="logout-button"
    :title="$store.state.user ? `Sign out: ${$store.state.user.username}#${$store.state.user.discriminator}` : 'Sign out'"
    @click="signOut"
  >
    <img
      src="../assets/logout.svg"
      alt="Sign-out icon"
    >
    <span>{{ $store.state.user ? `${$store.state.user.username}#${$store.state.user.discriminator}` : 'Sign out' }}</span>
  </button>
</template>

<script>
export default {
  methods: {
    signIn() {
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${
        encodeURIComponent(process.env.VUE_APP_CLIENT_ID)
      }&redirect_uri=${
        encodeURIComponent(`${process.env.VUE_APP_BASE_URL}/oauth2`)
      }&state=${
        encodeURIComponent(this.$route.path)
      }&response_type=code&scope=identify`;
    },
    signOut() {
      this.$store.dispatch('signOut');
    },
  },
};
</script>

<style scoped>
.login-button, .logout-button {
  padding: .5em 16px;
  display: flex;
  font-size: 1.1rem;
  line-height: 1.1rem;
  align-items: center;
}
.login-button > span, .logout-button > span {
  white-space: nowrap;
  text-align: left;
}
.login-button > span {
  margin-right: .25em;
}
.login-button > img {
  margin-left: .25em;
  margin-top: -.5em;
  margin-bottom: -.5em;
  display: block;
  height: 2em;
}
.logout-button > img {
  margin-right: .25em;
  margin-top: -.15em;
  margin-bottom: -.15em;
  display: block;
  height: 1.3em;
}
.logout-button > span {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
</style>
