<script lang="ts" setup>
import {
  FormatListBulletedOutlined,
  LibraryBooksOutlined,
  TuneOutlined,
} from '@vicons/material';

defineProps<{
  novelUrl?: string;
}>();

const emit = defineEmits<{
  requireCatalogModal: [];
  requireSettingModal: [];
}>();
</script>

<template>
  <n-flex :wrap="false">
    <div style="flex: auto">
      <slot />
    </div>

    <div style="flex: 0 0 0">
      <n-flex
        size="large"
        vertical
        style="margin-left: 20px; position: fixed; bottom: 20px"
      >
        <router-link v-if="novelUrl" :to="novelUrl">
          <side-button text="Details" :icon="LibraryBooksOutlined" />
        </router-link>
        <side-button
          text="Catalog"
          :icon="FormatListBulletedOutlined"
          @click="emit('requireCatalogModal')"
        />
        <side-button
          text="Settings"
          :icon="TuneOutlined"
          @click="emit('requireSettingModal')"
        />
      </n-flex>
    </div>
  </n-flex>
</template>
