<template>
  <div class="page">
    Unable to authenticate<template v-if="$route.query.error_description">
      {{ $route.query.error_description }}
    </template>
    <br>
    <router-link
      v-if="$route.query.state"
      :to="$route.query.state"
    >
      Try again
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'Oauth2',
};
</script>
