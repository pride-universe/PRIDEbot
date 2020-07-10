<template>
  <div
    :class="['role', loading && 'role_loading']"
    :title="name"
    @click="toggleRole"
  >
    <span
      :class="['indicator', checked && 'indicator_active']"
      :style="{
        borderColor: color,
      }"
    />
    <span :style="{ color }">{{ name }}</span>
  </div>
</template>

<script>
import api from '../api';

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    roleId: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    checked: {
      type: Boolean,
      required: true,
    },
  },
  data: () => ({
    loading: false,
  }),
  methods: {
    toggleRole() {
      if (this.loading) return;
      this.loading = true;
      api.post(`/servers/${encodeURIComponent(this.guildId)}/roles`, {
        role: this.roleId,
        value: Boolean(!this.checked),
      }).then((response) => {
        this.loading = false;
        this.$emit('onChange', response.data.payload);
      }, (err) => {
        console.error(err);
        this.loading = false;
      });
    },
  },
};
</script>

<style scoped>
.role {
  border-color: var(--text-normal);;
  border-style: solid;
  border-width: 1px;
  padding: 5px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  margin: 5px;
  user-select: none;
  cursor: pointer;
  font-weight: bold;
}
.role_loading {
  pointer-events: none;
  cursor: default;
  opacity: .3;
}
.indicator {
  position: relative;
  display: block;
  width: 1em;
  height: 1em;
  border-style: solid;
  border-width: 3px;
  border-radius: 50%;
  margin-right: .25em;
}
.indicator_active::after {
  position: absolute;
  content: '';
  display: block;
  top: 4px;
  bottom: 4px;
  left: 4px;
  right: 4px;;
  background: var(--text-normal);
  border-radius: 50%;
}
h2 {
  font-size: 1.75rem;
  margin-top: 0;
}
</style>
