<template>
  <div
    v-if="redirecting"
    class="page"
  >
    Redirecting to discord...
  </div>
  <div
    v-else
    class="page"
  >
    <template
      v-if="guild != null"
    >
      <h1 class="guild-title">
        <server-icon
          :guild-id="guild.id"
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          active
          :clickable="false"
        />
        <span>{{ guild.name }}</span>
      </h1>
      <role-group
        v-for="(group, index) in guild.groups"
        :key="index+group.name"
        :name="group.name"
        :roles="group.roleEntries"
        :guild-id="guild.id"
        @onChange="handleChange"
      />
    </template>
    <template v-else-if="loading">
      Loading...
    </template>
    <template
      v-else
    >
      Invalid URL
    </template>
  </div>
</template>

<script>
import { decodeSnowflake } from '../../../src/modules/snowflakeString';
import api from '../api';
import ServerIcon from '../components/ServerIcon.vue';
import RoleGroup from '../components/RoleGroup.vue';

function getAuthUrl(guildEncodedId) {
  return `https://discord.com/api/oauth2/authorize?client_id=${
    encodeURIComponent(process.env.VUE_APP_CLIENT_ID)
  }&redirect_uri=${
    encodeURIComponent(`${process.env.VUE_APP_BASE_URL}/oauth2`)
  }&state=${
    encodeURIComponent(`/r/${encodeURIComponent(guildEncodedId)}`)
  }&response_type=code&scope=identify`;
}

export default {
  name: 'RolePicker',
  components: {
    ServerIcon,
    RoleGroup,
  },
  data: () => ({
    loading: false,
    guild: null,
    redirecting: false,
  }),
  beforeRouteUpdate(to, from, next) {
    this.fetchGuildInfo(to).then(() => next(), () => next());
  },
  computed: {
    authToken() {
      return this.$store.state.authToken;
    },
  },
  watch: {
    authToken() {
      this.fetchGuildInfo(this.$route);
    },
  },
  mounted() {
    this.fetchGuildInfo(this.$route);
  },
  methods: {
    fetchGuildInfo(to) {
      try {
        const id = decodeSnowflake(to.params.id);
        if (this.$store.state.authToken == null) {
          this.redirecting = true;
          window.location.assign(getAuthUrl(to.params.id));
          return Promise.resolve();
        }
        this.loading = true;
        return api
          .get(`/servers/${encodeURIComponent(id)}`)
          .then((response) => {
            this.loading = false;
            this.guild = response.data.payload;
          }, (err) => {
            console.error(err);
            this.loading = false;
            this.guild = null;
          });
      } catch (err) {
        console.error(err);
        this.guild = null;
        return Promise.resolve();
      }
    },
    handleChange({ role, acquired }) {
      this.guild.groups.forEach((group) => {
        group.roleEntries.forEach((roleEntry) => {
          if (roleEntry.id === role) {
            roleEntry.acquired = acquired;
          }
        });
      });
    },
  },
};
</script>

<style scoped>
  .guild-title {
    font-size: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .guild-title > span {
    margin-left: 1rem;
  }
</style>
