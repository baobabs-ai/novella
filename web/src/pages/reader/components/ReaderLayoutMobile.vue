<script lang="ts" setup>
import {
  ArrowBackIosOutlined,
  ArrowForwardIosOutlined,
  FormatListBulletedOutlined,
  LibraryBooksOutlined,
  TuneOutlined,
} from '@vicons/material';

import { Locator } from '@/data';
import { WebNovelChapterDto } from '@/model/WebNovel';

defineProps<{
  novelUrl?: string;
  chapter: WebNovelChapterDto;
}>();

const emit = defineEmits<{
  nav: [string];
  requireCatalogModal: [];
  requireSettingModal: [];
}>();

const showMenu = ref(false);

const { setting } = Locator.readerSettingRepository();

const onGlobalClick = (event: MouseEvent) => {
  const scrollBy = (y: number) => {
    window.scrollBy({
      top: y * window.innerHeight,
      behavior: setting.value.enableClickAnimition ? 'smooth' : 'instant',
    });
  };

  const scrollByIfNeed = (p: number) => {
    const t = 0.15;
    const distance = 0.8;
    if (p < t) {
      scrollBy(-distance);
    } else if (p > 1 - t) {
      scrollBy(distance);
    } else {
      showMenu.value = true;
    }
  };

  if (
    setting.value.clickArea === 'default' ||
    setting.value.clickArea === 'up-down'
  ) {
    const py = event.clientY / window.innerHeight;
    scrollByIfNeed(py);
  } else if (setting.value.clickArea === 'left-right') {
    const px = event.clientX / window.innerWidth;
    scrollByIfNeed(px);
  } else {
    showMenu.value = true;
  }
};
</script>

<template>
  <div @click="onGlobalClick">
    <slot />
  </div>

  <n-drawer
    v-model:show="showMenu"
    :height="'auto'"
    placement="bottom"
    :auto-focus="false"
  >
    <n-flex
      :size="0"
      style="
        width: 100%;
        margin-top: 4px;
        margin-bottom: 4px;
        padding-bottom: env(safe-area-inset-bottom);
      "
    >
      <div style="flex: 1 1 0px">
        <side-button
          quaternary
          :disabled="!chapter.prevId"
          text="Previous Chapter"
          :icon="ArrowBackIosOutlined"
          @click="emit('nav', chapter.prevId!)"
          style="width: 100%"
        />
      </div>
      <router-link v-if="novelUrl" :to="novelUrl" style="flex: 1">
        <side-button
          quaternary
          text="Details"
          :icon="LibraryBooksOutlined"
          style="width: 100%"
        />
      </router-link>
      <div style="flex: 1 1 0px">
        <side-button
          quaternary
          text="Catalog"
          :icon="FormatListBulletedOutlined"
          @click="emit('requireCatalogModal')"
          style="width: 100%"
        />
      </div>
      <div style="flex: 1 1 0px">
        <side-button
          quaternary
          text="Settings"
          :icon="TuneOutlined"
          @click="emit('requireSettingModal')"
          style="width: 100%"
        />
      </div>
      <div style="flex: 1 1 0px">
        <side-button
          quaternary
          :disabled="!chapter.nextId"
          text="Next Chapter"
          :icon="ArrowForwardIosOutlined"
          @click="emit('nav', chapter.nextId!)"
          style="width: 100%"
        />
      </div>
    </n-flex>
  </n-drawer>
</template>
