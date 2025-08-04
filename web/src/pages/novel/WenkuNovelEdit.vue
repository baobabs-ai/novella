<script lang="ts" setup>
import {
  DeleteOutlineOutlined,
  KeyboardDoubleArrowDownOutlined,
  KeyboardDoubleArrowUpOutlined,
  UploadOutlined,
} from '@vicons/material';
import { FormInst, FormItemRule, FormRules } from 'naive-ui';
import { VueDraggable } from 'vue-draggable-plus';

import { Locator } from '@/data';
import { prettyCover, smartImport } from '@/domain/smart-import';
import coverPlaceholder from '@/image/cover_placeholder.png';
import {
  WenkuNovelOutlineDto,
  WenkuVolumeDto,
  presetKeywordsNonR18,
  presetKeywordsR18,
} from '@/model/WenkuNovel';
import { RegexUtil, delay } from '@/util';
import { runCatching } from '@/util/result';

import { doAction, useIsWideScreen } from '@/pages/util';
import { useWenkuNovelStore } from './WenkuNovelStore';

const { novelId } = defineProps<{
  novelId: string | undefined;
}>();

const store = novelId !== undefined ? useWenkuNovelStore(novelId) : undefined;

const router = useRouter();
const isWideScreen = useIsWideScreen();
const message = useMessage();

const { whoami } = Locator.authRepository();

const allowSubmit = ref(novelId === undefined);
const formRef = ref<FormInst>();
const formValue = ref({
  title: '',
  titleZh: '',
  cover: '',
  authors: <string[]>[],
  artists: <string[]>[],
  level: '一般向',
  keywords: <string[]>[],
  introduction: '',
  volumes: <WenkuVolumeDto[]>[],
});
const formRules: FormRules = {
  title: [
    {
      validator: (_rule: FormItemRule, value: string) =>
        value.trim().length > 0,
      message: '标题不能为空',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 80,
      message: '标题长度不能超过80个字符',
      trigger: 'input',
    },
  ],
  titleZh: [
    {
      validator: (_rule: FormItemRule, value: string) =>
        value.trim().length > 0,
      message: '标题不能为空',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 80,
      message: '标题长度不能超过80个字符',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) =>
        !RegexUtil.hasKanaChars(value),
      message: 'Do not use Japanese as English title, if there is no recognized title, try translating it yourself',
      trigger: 'input',
    },
  ],
  level: [
    {
      validator: (_rule: FormItemRule, value: string) =>
        value !== '成人向' || whoami.value.allowNsfw,
      message: 'You are too young to create an adult page',
      trigger: 'input',
    },
  ],
  introduction: [
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 500,
      message: '简介长度不能超过500个字符',
      trigger: 'input',
    },
  ],
};

const amazonUrl = ref('');

store?.loadNovel()?.then((result) => {
  if (result.ok) {
    const {
      title,
      titleZh,
      cover,
      authors,
      artists,
      level,
      keywords,
      introduction,
    } = result.value;
    formValue.value = {
      title,
      titleZh,
      cover: prettyCover(cover ?? ''),
      authors,
      artists,
      level,
      keywords,
      introduction,
      volumes: result.value.volumes.map((it) => {
        it.cover = prettyCover(it.cover);
        return it;
      }),
    };
    amazonUrl.value = result.value.title.replace(/[?？。!！]$/, '');
    allowSubmit.value = true;
  } else {
    message.error('Failed to load');
  }
});

const submit = async () => {
  if (!allowSubmit.value) {
    message.warning('Article not loaded, cannot submit');
    return;
  }

  try {
    await formRef.value?.validate();
  } catch (e) {
    return;
  }

  const allPresetKeywords = presetKeywords.value.groups.flatMap(
    (it) => it.presetKeywords,
  );

  const body = {
    title: formValue.value.title,
    titleZh: formValue.value.titleZh,
    cover: formValue.value.cover,
    authors: formValue.value.authors,
    artists: formValue.value.artists,
    level: formValue.value.level,
    introduction: formValue.value.introduction,
    keywords: formValue.value.keywords.filter((it) =>
      allPresetKeywords.includes(it),
    ),
    volumes: formValue.value.volumes,
  };

  if (store === undefined) {
    await doAction(
      Locator.wenkuNovelRepository.createNovel(body).then((id) => {
        router.push({ path: `/wenku/${id}` });
      }),
      'Create Light Novel',
      message,
    );
  } else {
    await doAction(
      store.updateNovel(body).then(() => {
        router.push({ path: `/wenku/${novelId}` });
      }),
      'Edit Light Novel',
      message,
    );
  }
};

const populateNovelFromAmazon = async (
  urlOrQuery: string,
  forcePopulateVolumes: boolean,
) => {
  const msgReactive = message.create('', {
    type: 'loading',
    duration: 0,
  });

  await smartImport(
    urlOrQuery.trim(),
    formValue.value.volumes,
    forcePopulateVolumes,
    {
      log: (message) => {
        msgReactive.content = message;
      },
      populateNovel: (novel) => {
        formValue.value = {
          title: formValue.value.title ? formValue.value.title : novel.title,
          titleZh: formValue.value.titleZh
            ? formValue.value.titleZh
            : novel.titleZh ?? '',
          cover: novel.volumes[0]?.cover,
          authors:
            formValue.value.authors.length > 0
              ? formValue.value.authors
              : novel.authors,
          artists:
            formValue.value.artists.length > 0
              ? formValue.value.artists
              : novel.artists,
          level: novel.r18 ? '成人向' : '一般向',
          keywords: formValue.value.keywords,
          introduction: formValue.value.introduction
            ? formValue.value.introduction
            : novel.introduction,
          volumes: novel.volumes,
        };
      },
      populateVolume: (volume) => {
        const index = formValue.value.volumes.findIndex(
          (it) => it.asin === volume.asin,
        );
        if (index >= 0) {
          formValue.value.volumes[index] = volume;
        }
      },
    },
  );

  formValue.value.cover = formValue.value.volumes[0]?.cover;
  msgReactive.content = '智能导入完成';
  msgReactive.type = 'info';
  delay(3000).then(() => msgReactive.destroy());
};

const submitCurrentStep = ref(1);
const title = computed(() => formValue.value.title);
const similarNovels = ref<WenkuNovelOutlineDto[] | null>(null);

watch(title, () => {
  similarNovels.value = null;
  submitCurrentStep.value = 1;
});
const findSimilarNovels = async () => {
  const query = title.value.split(
    /[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/,
    2,
  )[0];
  const result = await runCatching(
    Locator.wenkuNovelRepository.listNovel({
      page: 0,
      pageSize: 6,
      query,
      level: 0,
    }),
  );
  if (result.ok) {
    similarNovels.value = result.value.items;
  } else {
    message.error('Failed to search for similar novels:' + result.error.message);
  }
};
const moveToPrevStep = () => {
  if (submitCurrentStep.value > 1) {
    submitCurrentStep.value -= 1;
  }
};
const moveToNextStep = () => {
  if (submitCurrentStep.value < 3) {
    submitCurrentStep.value += 1;
  }
};
const topVolume = (asin: string) => {
  formValue.value.volumes.sort((a, b) => {
    return a.asin == asin ? -1 : b.asin == asin ? 1 : 0;
  });
};
const bottomVolume = (asin: string) => {
  formValue.value.volumes.sort((a, b) => {
    return a.asin == asin ? 1 : b.asin == asin ? -1 : 0;
  });
};
const deleteVolume = (asin: string) => {
  formValue.value.volumes = formValue.value.volumes.filter(
    (it) => it.asin !== asin,
  );
};

const markAsDuplicate = () => {
  formValue.value = {
    title: 'Duplicate, pending deletion',
    titleZh: 'Duplicate, pending deletion',
    cover: '',
    authors: [],
    artists: [],
    level: formValue.value.level,
    keywords: [],
    introduction: '',
    volumes: [],
  };
};

const presetKeywords = computed(() => {
  if (formValue.value.level === '一般向') {
    return presetKeywordsNonR18;
  } else {
    return presetKeywordsR18;
  }
});
const showKeywordsModal = ref(false);

const togglePresetKeyword = (checked: boolean, keyword: string) => {
  if (checked) {
    formValue.value.keywords.push(keyword);
  } else {
    formValue.value.keywords = formValue.value.keywords.filter(
      (it) => it !== keyword,
    );
  }
};

const levelOptions = [
  { label: '一般向', value: '一般向' },
  { label: '成人向', value: '成人向' },
  { label: '严肃向', value: '严肃向' },
];
</script>

<template>
  <div class="layout-content">
    <n-h1>{{ novelId === undefined ? 'Create' : 'Edit' }} Light Novel</n-h1>

    <n-card embedded :bordered="false" style="margin-bottom: 20px">
      <n-text type="error">
        <b>Notes for creating light novels:</b>
      </n-text>
      <n-ul>
        <n-li>
          Please install the machine translation extension to enable the intelligent import function, and the automatic machine translation introduction function requires you to use Youdao translation.
        </n-li>
        <n-li>
          Light novels only allow Japanese novels that have been published as single volumes, in principle based on what can be purchased on Amazon, series novels should not be imported separately.
        </n-li>
        <n-li>
          Enter Amazon series/single volume links in the import field for direct import, or enter the Japanese main title of the novel to search and import.
        </n-li>
        <n-li>
          Import R18 books require registration on the machine translation site for one month, use a Japanese IP, and have clicked "I am 18 years old" on Amazon.
        </n-li>
      </n-ul>
    </n-card>

    <n-flex style="margin-bottom: 48px; width: 100%">
      <div v-if="isWideScreen">
        <n-image
          width="160"
          :src="formValue.cover ? formValue.cover : coverPlaceholder"
          alt="cover"
        />
      </div>

      <n-flex size="large" vertical style="flex: auto">
        <n-input-group>
          <n-input
            v-model:value="amazonUrl"
            :placeholder="formValue.title"
            :input-props="{ spellcheck: false }"
          />
          <c-button
            label="Import"
            :round="false"
            type="primary"
            @action="populateNovelFromAmazon(amazonUrl, false)"
          />
        </n-input-group>
        <n-flex>
          <c-button
            label="Search on Amazon"
            secondary
            tag="a"
            :href="`https://www.amazon.co.jp/s?k=${encodeURIComponent(
              formValue.title,
            )}&i=stripbooks`"
            target="_blank"
          />
          <c-button
            secondary
            label="Refresh Volumes"
            @action="populateNovelFromAmazon('', true)"
          />
          <c-button
            v-if="whoami.isMaintainer"
            type="error"
            secondary
            label="Mark as Duplicate"
            @action="markAsDuplicate"
          />
        </n-flex>
      </n-flex>
    </n-flex>

    <n-form
      ref="formRef"
      :model="formValue"
      :rules="formRules"
      :label-placement="isWideScreen ? 'left' : 'top'"
      label-width="auto"
    >
      <n-form-item-row path="title" label="Japanese Title">
        <n-input
          v-model:value="formValue.title"
          placeholder="Please enter Japanese title"
          maxlength="80"
          show-count
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>

      <n-form-item-row path="titleZh" label="English Title">
        <n-input
          v-model:value="formValue.titleZh"
          placeholder="Please enter English title"
          maxlength="80"
          show-count
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>

      <n-form-item-row path="cover" label="Cover Link">
        <n-input
          v-model:value="formValue.cover"
          placeholder="Please enter cover link"
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>

      <n-form-item-row path="authors" label="Author">
        <n-dynamic-tags v-model:value="formValue.authors" />
      </n-form-item-row>

      <n-form-item-row path="artists" label="Artist">
        <n-dynamic-tags v-model:value="formValue.artists" />
      </n-form-item-row>

      <n-form-item-row path="level" label="Level">
        <c-radio-group
          v-model:value="formValue.level"
          :options="levelOptions"
        />
      </n-form-item-row>

      <n-form-item-row path="content" label="Introduction">
        <n-input
          v-model:value="formValue.introduction"
          type="textarea"
          placeholder="Please enter novel introduction"
          :autosize="{
            minRows: 8,
            maxRows: 24,
          }"
          maxlength="500"
          show-count
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>

      <n-form-item-row label="Tags">
        <n-list bordered style="width: 100%">
          <n-list-item>
            <c-button
              v-if="presetKeywords.groups.length > 0"
              label="Use Before Reading"
              @action="showKeywordsModal = true"
              text
              type="error"
            />
            <n-p v-else>Tags are not supported for now.</n-p>
          </n-list-item>
          <n-list-item
            v-for="group of presetKeywords.groups"
            :key="group.title"
          >
            <n-flex size="small">
              <n-tag :bordered="false" size="small">
                <b>{{ group.title }}</b>
              </n-tag>
              <n-tag
                v-for="keyword of group.presetKeywords"
                :key="keyword"
                size="small"
                checkable
                :checked="formValue.keywords.includes(keyword)"
                @update:checked="
                  (checked: boolean) => togglePresetKeyword(checked, keyword)
                "
              >
                {{ keyword }}
              </n-tag>
            </n-flex>
          </n-list-item>
        </n-list>
      </n-form-item-row>

      <n-form-item-row label="Volumes" v-if="formValue.volumes.length > 0">
        <n-list style="width: 100%; font-size: 12px">
          <vue-draggable
            v-model="formValue.volumes"
            :animation="150"
            handle=".drag-trigger"
          >
            <n-list-item v-for="volume of formValue.volumes" :key="volume.asin">
              <n-thing>
                <template #avatar>
                  <div>
                    <n-image
                      class="drag-trigger"
                      width="88"
                      :src="volume.cover"
                      :preview-src="volume.coverHires ?? volume.cover"
                      :alt="volume.asin"
                      lazy
                      style="border-radius: 2px; cursor: move"
                    />
                  </div>
                </template>

                <template #header>
                  <n-text style="font-size: 12px">
                    ASIN：
                    <n-a
                      :href="`https://www.amazon.co.jp/zh/dp/${volume.asin}`"
                    >
                      {{ volume.asin }}
                    </n-a>
                  </n-text>
                </template>

                <template #header-extra>
                  <n-flex :size="6" :wrap="false">
                    <c-icon-button
                      tooltip="Top"
                      :icon="KeyboardDoubleArrowUpOutlined"
                      @action="topVolume(volume.asin)"
                    />

                    <c-icon-button
                      tooltip="Bottom"
                      :icon="KeyboardDoubleArrowDownOutlined"
                      @action="bottomVolume(volume.asin)"
                    />

                    <c-icon-button
                      tooltip="Delete"
                      :icon="DeleteOutlineOutlined"
                      type="error"
                      @action="deleteVolume(volume.asin)"
                    />
                  </n-flex>
                </template>

                <template #description>
                  <n-flex align="center" :size="0" :wrap="false">
                    <n-text style="word-break: keep-all; font-size: 12px">
                      Title：
                    </n-text>
                    <n-input
                      v-model:value="volume.title"
                      placeholder="Title"
                      :input-props="{ spellcheck: false }"
                      size="small"
                      style="font-size: 12px"
                    />
                  </n-flex>
                  <n-text style="font-size: 12px">
                    Thumbnail：{{ volume.cover }}
                    <br />
                    High Resolution：{{ volume.coverHires }}
                    <br />
                    Publisher：
                    {{ volume.publisher ?? 'Unknown Publisher' }}
                    /
                    {{ volume.imprint ?? 'Unknown Publisher' }}
                    /
                    <n-time
                      v-if="volume.publishAt"
                      :time="volume.publishAt * 1000"
                      type="date"
                    />
                  </n-text>
                </template>
              </n-thing>
            </n-list-item>
          </vue-draggable>
        </n-list>
      </n-form-item-row>
    </n-form>

    <n-divider />

    <c-button
      v-if="novelId"
      label="Submit"
      :icon="UploadOutlined"
      require-login
      size="large"
      type="primary"
      class="float"
      @action="submit"
    />

    <n-steps
      v-else
      :current="submitCurrentStep"
      vertical
      style="margin-left: 8px"
    >
      <n-step title="Check if the novel already exists">
        <p>
          Before creating a light novel page, please first confirm that the novel page you want to create does not exist, do not create duplicates. You can search for chapter titles using the search button below, note that automatic search does not always correctly extract keywords, if the keywords are incorrect, please manually search for the Japanese title.
        </p>
        <p>
          Automatic search keywords：
          <b>
            {{
              title.split(
                /[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/,
                2,
              )[0]
            }}
          </b>
        </p>
        <p v-if="similarNovels !== null">
          <template v-if="similarNovels.length === 0">No similar novels</template>
          <n-grid v-else :x-gap="12" :y-gap="12" cols="3 600:6">
            <n-grid-item v-for="item in similarNovels" :key="item.id">
              <router-link :to="`/wenku/${item.id}`">
                <ImageCard
                  :src="item.cover"
                  :title="item.titleZh ? item.titleZh : item.title"
                />
              </router-link>
            </n-grid-item>
          </n-grid>
        </p>
        <n-button-group v-if="submitCurrentStep === 1">
          <c-button
            label="I confirm the novel does not exist"
            type="warning"
            @click="moveToNextStep"
          />
          <c-button label="Auto-search similar novels" @click="findSimilarNovels" />
        </n-button-group>
      </n-step>

      <n-step title="Check if novel files can be uploaded">
        <p>
          Before creating a light novel page, please first confirm that you have novel files that can be uploaded. Do not create a light novel page and then look for resources, only to find that the resources cannot be used or cannot be found, leaving an empty light novel page. It is especially forbidden to create empty pages to request books, which will result in account suspension.
        </p>
        <p>PDF, or EPUB files that only contain images cannot be uploaded.</p>

        <n-button-group v-if="submitCurrentStep === 2">
          <c-button
            label="I confirm I have files that can be uploaded"
            type="warning"
            @click="moveToNextStep"
          />
          <c-button label="Previous step" @click="moveToPrevStep" />
        </n-button-group>
      </n-step>

      <n-step title="Create Light Novel">
        <n-button-group v-if="submitCurrentStep === 3" style="margin-top: 16px">
          <c-button
            label="Submit"
            :icon="UploadOutlined"
            require-login
            type="primary"
            @action="submit"
          />
          <c-button label="Previous step" @click="moveToPrevStep" />
        </n-button-group>
      </n-step>
    </n-steps>
  </div>

  <c-modal title="Instructions" v-model:show="showKeywordsModal">
    <n-p>
      The meaning of tags is to assist in searching. Whether a tag is appropriate depends on the proportion of related plot lines. Simply existing related plot lines are not sufficient grounds for adding tags. In actual operation, you can think about whether users searching for this tag want to see this book.
    </n-p>
    <n-p>
      Below are some specific explanations of tags. Note that the same tag may have different meanings in general and R18.
    </n-p>
    <n-divider />
    <n-p v-for="row of presetKeywords.explanations" :key="row.word">
      <b>{{ row.word }}</b>
      <br />
      {{ row.explanation }}
    </n-p>
  </c-modal>
</template>
