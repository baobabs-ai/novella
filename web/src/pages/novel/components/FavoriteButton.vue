<script lang="ts" setup>
import { FavoriteBorderOutlined, FavoriteOutlined } from '@vicons/material';

import { Locator } from '@/data';

import { doAction } from '@/pages/util';

const props = defineProps<{
  favored: string | undefined;
  novel:
    | { type: 'web'; providerId: string; novelId: string }
    | { type: 'wenku'; novelId: string };
}>();
const emit = defineEmits<{
  'update:favored': [string | undefined];
}>();

const message = useMessage();

const { whoami } = Locator.authRepository();
const favoredRepository = Locator.favoredRepository();

onMounted(async () => {
  if (whoami.value.isSignedIn) {
    try {
      await favoredRepository.loadRemoteFavoreds();
    } catch (e) {
      message.error(`Failed to get favorites list: ${e}`);
    }
  }
});

const favoreds = computed(
  () => favoredRepository.favoreds.value[props.novel.type],
);
const favoredTitle = computed(
  () => favoreds.value.find((it) => it.id === props.favored)?.title,
);

const favoriteNovel = (favoredId: string) =>
  doAction(
    favoredRepository.favoriteNovel(favoredId, props.novel).then(() => {
      emit('update:favored', favoredId);
      showFavoredModal.value = false;
    }),
    'Favorited',
    message,
  );

const unfavoriteNovel = async () => {
  if (props.favored === undefined) return;
  await doAction(
    favoredRepository.unfavoriteNovel(props.favored, props.novel).then(() => {
      emit('update:favored', undefined);
      showFavoredModal.value = false;
    }),
    'Unfavorite',
    message,
  );
};

const showFavoredModal = ref(false);
const selectedFavoredId = ref(props.favored ?? 'default');
</script>

<template>
  <template v-if="favoreds.length <= 1">
    <c-button
      v-if="favored && favoredTitle"
      label="Favorited"
      :icon="FavoriteOutlined"
      require-login
      @action="unfavoriteNovel"
    />
    <c-button
      v-else
      label="Favorite"
      :icon="FavoriteBorderOutlined"
      require-login
      @action="favoriteNovel(favoreds[0].id)"
    />
  </template>

  <template v-else>
    <c-button
      :label="favored && favoredTitle ? 'Favorited:' + favoredTitle : 'Favorite'"
      :icon="favored ? FavoriteOutlined : FavoriteBorderOutlined"
      require-login
      @action="showFavoredModal = true"
    />
  </template>

  <c-modal v-model:show="showFavoredModal" title="Favorite to...">
    <n-radio-group v-model:value="selectedFavoredId">
      <n-flex vertical size="large">
        <n-radio
          v-for="favoredItem in favoreds"
          :key="favoredItem.id"
          :value="favoredItem.id"
        >
          {{ favoredItem.title }}
        </n-radio>
        <n-radio key="deleted" value="deleted">Unfavorite</n-radio>
      </n-flex>
    </n-radio-group>
    <template #action>
      <c-button
        label="Confirm"
        require-login
        type="primary"
        @action="
          selectedFavoredId === 'deleted'
            ? unfavoriteNovel()
            : favoriteNovel(selectedFavoredId)
        "
      />
    </template>
  </c-modal>
</template>
