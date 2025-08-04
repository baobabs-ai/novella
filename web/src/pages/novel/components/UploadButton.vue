<script lang="ts" setup>
import { PlusOutlined } from '@vicons/material';
import {
  UploadCustomRequestOptions,
  UploadFileInfo,
  UploadInst,
} from 'naive-ui';

import { Locator, formatError } from '@/data';
import { useWenkuNovelStore } from '../WenkuNovelStore';
import { RegexUtil } from '@/util';
import { getFullContent } from '@/util/file';

const props = defineProps<{
  novelId: string;
  allowZh: boolean;
}>();

const message = useMessage();

const { whoami } = Locator.authRepository();

const store = useWenkuNovelStore(props.novelId);

async function beforeUpload({ file }: { file: UploadFileInfo }) {
  if (!whoami.value.isSignedIn) {
    message.info('Please log in first');
    return false;
  }
  if (!file.file) {
    return false;
  }
  if (
    ['jp', 'zh', 'zh-jp', 'jp-zh'].some((prefix) =>
      file.file!.name.startsWith(prefix),
    )
  ) {
    message.error('Do not upload machine-translated files generated on this website');
    return false;
  }
  if (file.file.size > 1024 * 1024 * 40) {
    message.error('File size cannot exceed 40MB');
    return false;
  }

  let content: string;
  try {
    content = await getFullContent(file.file);
  } catch (e) {
    console.error(e);
    message.error(`File parsing error:${e}`);
    return false;
  }
  const charsCount = RegexUtil.countLanguageCharacters(content);
  if (charsCount.total < 500) {
    message.error('Word count too low, please check if the content is images');
    return false;
  }

  const p = (charsCount.jp + charsCount.ko) / charsCount.total;
  if (p < 0.33) {
    if (!props.allowZh) {
      message.error('Suspected Chinese novel, light novels are not allowed to upload');
      return false;
    } else {
      file.url = 'zh';
    }
  } else {
    file.url = 'jp';
  }
}

const customRequest = async ({
  file,
  onFinish,
  onError,
  onProgress,
}: UploadCustomRequestOptions) => {
  if (!whoami.value.isSignedIn) {
    onError();
    return;
  }

  try {
    const type = file.url === 'jp' ? 'jp' : 'zh';
    await store.createVolume(file.name, type, file.file as File, (percent) =>
      onProgress({ percent }),
    );
    onFinish();
  } catch (e) {
    onError();
    message.error(`Upload failed:${await formatError(e)}`);
  }
};

const ruleViewed = Locator.ruleViewedRepository().ref;
const showRuleModal = ref(false);
const haveReadRule = computed(() => {
  const durationSinceLastRead = Date.now() - ruleViewed.value.wenkuUploadRule;
  return durationSinceLastRead < 24 * 3600 * 1000;
});
const uploadRef = ref<UploadInst>();
const uploadVolumes = () => {
  showRuleModal.value = true;
  ruleViewed.value.wenkuUploadRule = Date.now();
};
</script>

<template>
  <c-button
    v-if="!haveReadRule"
    label="Upload"
    :icon="PlusOutlined"
    @action="uploadVolumes"
  />
  <n-upload
    ref="uploadRef"
    accept=".txt,.epub"
    multiple
    :custom-request="customRequest"
    :show-trigger="haveReadRule"
    @before-upload="beforeUpload"
  >
    <c-button label="Upload" :icon="PlusOutlined" />
  </n-upload>

  <c-modal
    title="Upload Notice"
    v-model:show="showRuleModal"
    @after-leave="uploadRef?.openOpenFileDialog()"
  >
    <n-p>Before uploading novels, please be sure to follow the following rules.</n-p>
    <n-ul>
      <n-li>
        Before uploading Japanese chapters, please make sure there is text inside. Single volume book compressed packages over 40MB are likely to contain only scanned images without text, which cannot be translated.
      </n-li>
      <n-li>EPUB files larger than 40MB cannot be uploaded, please compress the images inside.</n-li>
      <n-li>Do not upload existing volumes, if there are problems with existing volumes, please contact the administrator.</n-li>
      <n-li>Volume filenames should only contain Japanese titles, volume numbers, and volume Japanese titles.</n-li>
    </n-ul>
    <n-p>Since light novels are still under development, rules may change, please pay attention.</n-p>

    <template #action>
      <c-button label="Confirm" type="primary" @action="showRuleModal = false" />
    </template>
  </c-modal>
</template>
