<script lang="ts" setup>
import { useIsWideScreen } from '@/pages/util';
import { useWebNovelStore } from './WebNovelStore';

const { providerId, novelId } = defineProps<{
  providerId: string;
  novelId: string;
}>();

const isWideScreen = useIsWideScreen();
const router = useRouter();

const store = useWebNovelStore(providerId, novelId);
const { novelResult } = storeToRefs(store);

store.loadNovel().then((result) => {
  if (result && !result.ok) {
    const message = result.error.message;
    if (message.includes('Novel ID is not suitable, should use: ')) {
      const targetNovelPath = message.split('Novel ID is not suitable, should use: ')[1];
      router.push({ path: `/novel${targetNovelPath}` });
      return;
    }
  }

  if (result?.ok) {
    document.title = result.value.titleJp;
  }
});
</script>

<template>
  <div class="layout-content">
    <c-result :result="novelResult" v-slot="{ value: novel }">
      <web-novel-wide
        v-if="isWideScreen"
        :provider-id="providerId"
        :novel-id="novelId"
        :novel="novel"
      />
      <web-novel-narrow
        v-else
        :provider-id="providerId"
        :novel-id="novelId"
        :novel="novel"
      />
    </c-result>
  </div>
</template>
