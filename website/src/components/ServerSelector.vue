<template>
  <div
    v-if="guilds"
    class="guild-selector"
  >
    <div
      v-for="({ guild }) in guilds"
      :key="guild.id"
      class="server-icon-wrapper"
    >
      <server-icon
        :name="guild.name"
        :icon="guild.iconURL"
        :acronym="guild.nameAcronym"
        :guild-id="guild.id"
      />
    </div>
    <template v-if="false">
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
      <div
        v-for="({ guild }) in guilds"
        :key="guild.id"
        class="server-icon-wrapper"
      >
        <server-icon
          :name="guild.name"
          :icon="guild.iconURL"
          :acronym="guild.nameAcronym"
          :guild-id="guild.id"
        />
      </div>
    </template>
  </div>
</template>
<script>
import api from '../api';
import ServerIcon from './ServerIcon.vue';

export default {
  components: {
    ServerIcon,
  },
  data: () => ({
    guilds: null,
  }),
  computed: {
    authToken() {
      return this.$store.state.authToken;
    },
  },
  watch: {
    authToken(from, to) {
      if (!to) {
        this.guilds = null;
      }
      this.fetchGuilds();
    },
  },
  mounted() {
    this.fetchGuilds();
  },
  methods: {
    fetchGuilds() {
      try {
        if (this.$store.state.authToken == null) return;
        api
          .get('/servers')
          .then((response) => {
            this.guilds = response.data.payload;
          }, (err) => {
            if (err.isAxiosError && err.response.status === 401) {
              this.$store.dispatch('refreshToken');
            }
            return Promise.reject(err);
          }).catch((err) => {
            console.error(err);
          });
      } catch (err) {
        console.error(err);
      }
    },
  },
};
</script>

<style scoped>
  .guild-selector {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .server-icon-wrapper {
    flex-grow: 0;
    flex-shrink: 0;
    margin: 5px;
  }
</style>
