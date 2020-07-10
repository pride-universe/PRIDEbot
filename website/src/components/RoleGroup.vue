<template>
  <div class="role-group">
    <h2>{{ name }}</h2>
    <div class="roles">
      <role-entry
        v-for="role in roles"
        :key="role.id"
        :role-id="role.id"
        :name="role.name"
        :color="role.color"
        :guild-id="guildId"
        :checked="role.acquired"
        @onChange="(ev) => $emit('onChange', ev)"
      />
    </div>
  </div>
</template>

<script>
import RoleEntry from './RoleEntry.vue';

export default {
  components: {
    RoleEntry,
  },
  props: {
    name: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    roles: {
      type: Array,
      required: true,
    },
  },
  data: () => ({}),
};
</script>

<style scoped>
.role-group {
  background: var(--background-primary);
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 10px;
}
.roles {
  display: flex;
  flex-wrap: wrap;
}
h2 {
  font-size: 1.75rem;
  margin-top: 0;
  text-align: left;
}
</style>
