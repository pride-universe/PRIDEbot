<template>
  <div
    :class="['icon-wrapper', clickable && 'icon-wrapper_clickable']"
    :title="name"
    @mouseenter="hover = clickable && true"
    @mouseleave="hover = false"
  >
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      class="icon-svg"
      overflow="visible"
    >
      <defs>
        <g :id="`${uuid}-blob_mask`">
          <path
            v-if="showActive"
            d="M0 24C0 16.5449 0 12.8174 1.21793 9.87706C2.84183 5.95662 5.95662 2.84183 9.87706 1.21793C12.8174 0 16.5449 0 24
               0C31.4551 0 35.1826 0 38.1229 1.21793C42.0434 2.84183 45.1582 5.95662 46.7821 9.87706C48 12.8174 48 16.5449 48 24C48
               31.4551 48 35.1826 46.7821 38.1229C45.1582 42.0434 42.0434 45.1582 38.1229 46.7821C35.1826 48 31.4551 48 24 48C16.5449
               48 12.8174 48 9.87706 46.7821C5.95662 45.1582 2.84183 42.0434 1.21793 38.1229C0 35.1826 0 31.4551 0 24Z"
          />
          <path
            v-else
            d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z"
          />
        </g>
        <g :id="`${uuid}-upper_badge_masks`">
          <rect
            x="28"
            y="-4"
            width="24"
            height="24"
            rx="12"
            ry="12"
            transform="translate(20 -20)"
          />
        </g>
        <g :id="`${uuid}-lower_badge_masks`">
          <rect
            x="28"
            y="28"
            width="24"
            height="24"
            rx="12"
            ry="12"
            transform="translate(20 20)"
          />
        </g>
      </defs>
      <mask
        :id="uuid"
        fill="black"
        x="0"
        y="0"
        width="48"
        height="48"
      >
        <use
          :href="`#${uuid}-blob_mask`"
          fill="white"
        />
        <use
          :href="`#${uuid}-upper_badge_masks`"
          fill="black"
        />
        <use
          :href="`#${uuid}-lower_badge_masks`"
          fill="black"
        />
        <rect
          x="-4"
          y="-4"
          width="24"
          height="24"
          rx="12"
          ry="12"
          transform="translate(-20 -20)"
          fill="black"
        />
        <rect
          x="-4"
          y="28"
          width="24"
          height="24"
          rx="12"
          ry="12"
          transform="translate(-20 20)"
          fill="black"
        />
      </mask>
      <foreignObject
        :mask="`url(#${uuid})`"
        x="0"
        y="0"
        width="48"
        height="48"
      >
        <router-link
          v-if="clickable"
          tabindex="-1"
          class="icon-link"
          :aria-label="name"
          :to="href"
          :style="!icon ? `font-size: ${fontSize};` : null"
        >
          <img
            v-if="icon"
            class="icon-image"
            :src="icon"
            alt=""
            width="48"
            height="48"
            aria-hidden="true"
          >
          <div
            v-else
            :class="['icon-acronym', showActive && 'icon-acronym_active']"
            aria-hidden="true"
          >
            {{ acronym }}
          </div>
        </router-link>
        <span
          v-else
          class="icon-link"
          :aria-label="name"
          :style="!icon ? `font-size: ${fontSize};` : null"
        >
          <img
            v-if="icon"
            class="icon-image"
            :src="icon"
            alt=""
            width="48"
            height="48"
            aria-hidden="true"
          >
          <div
            v-else
            :class="['icon-acronym', showActive && 'icon-acronym_active']"
            aria-hidden="true"
          >
            {{ acronym }}
          </div>
        </span>
      </foreignObject>
    </svg>
  </div>
</template>

<script>
import { encodeSnowflake } from '../../../src/modules/snowflakeString';
/**
 * @param {string} acronym
 * @returns {string}
 */
function fontSize(acronym) {
  switch (acronym.length) {
    case 1:
    case 2: return '18px';
    case 3:
    case 4: return '16px';
    case 5: return '14px';
    case 6: return '12px';
    default: return '10px';
  }
}
export default {
  props: {
    guildId: {
      type: String,
      required: true,
    },
    acronym: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      required: false,
      default: false,
    },
    clickable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data: () => ({
    hover: false,
    uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => (
      c === 'x'
        // eslint-disable-next-line no-bitwise
        ? Math.random() * 16 | 0
        // eslint-disable-next-line no-bitwise
        : (((Math.random() * 16 | 0) & 0x3) | 0x8)).toString(16)),
  }),
  computed: {
    /**
     * @returns {string}
     */
    fontSize() {
      return fontSize(this.acronym);
    },
    href() {
      return `/r/${encodeURIComponent(encodeSnowflake(this.guildId))}`;
    },
    routeActive() {
      return this.href === this.$route.path;
    },
    showActive() {
      return this.routeActive || this.hover || this.active;
    },
  },
};
</script>

<style scoped>
  .icon-wrapper {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    width: 48px;
    height: 48px;
    position: relative;
    user-select: none;
  }
  .icon-wrapper_clickeable {
    cursor: pointer;
  }
  .icon-svg {
    position: absolute;
    top: 0;
    left: 0;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    width: 48px;
    height: 48px;
  }
  .icon-link {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    width: 48px;
    height: 48px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-transition: background-color .1s ease-out,color .1s ease-out;
    transition: background-color .1s ease-out,color .1s ease-out;
  }
  .icon-acronym {
    font-weight: 500;
    line-height: 1.2em;
    white-space: nowrap;
    -webkit-transition: background-color .15s ease-out,color .15s ease-out;
    transition: background-color .15s ease-out,color .15s ease-out;
    background-color: var(--background-primary);
    color: var(--text-normal);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    width: 48px;
    height: 48px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }
  .icon-acronym_active {
    color: #fff;
    background-color: #7289da;
  }
  .icon-image {
    display: block;
    width: 48px;
    height: 48px;
    -o-object-fit: cover;
    object-fit: cover;
    pointer-events: none;
  }
</style>
