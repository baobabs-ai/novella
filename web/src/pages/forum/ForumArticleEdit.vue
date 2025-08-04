<script lang="ts" setup>
import { UploadOutlined } from '@vicons/material';
import { FormInst, FormItemRule, FormRules } from 'naive-ui';

import { Locator } from '@/data';
import { ArticleCategory } from '@/model/Article';

import { doAction, useIsWideScreen } from '@/pages/util';
import { useArticleStore } from './ForumArticleStore';

const { articleId, category } = defineProps<{
  articleId: string | undefined;
  category: ArticleCategory | undefined;
}>();

const router = useRouter();
const isWideScreen = useIsWideScreen();
const message = useMessage();

const { whoami } = Locator.authRepository();
const draftRepo = Locator.draftRepository();
const draftId = `article-${articleId ?? 'new'}`;

const store = articleId !== undefined ? useArticleStore(articleId) : undefined;

const articleCategoryOptions = whoami.value.asMaintainer
  ? [
      { value: 'General', label: 'Novel Discussion' },
      { value: 'Guide', label: 'Usage Guide' },
      { value: 'Support', label: 'Feedback and Suggestions' },
    ]
  : [
      { value: 'General', label: 'Novel Discussion' },
      { value: 'Support', label: 'Feedback and Suggestions' },
    ];

const allowSubmit = ref(articleId === undefined);
const formRef = ref<FormInst>();
const formValue = ref({
  title: '',
  content: '',
  category: category ?? 'General',
});
const formRules: FormRules = {
  title: [
    {
      validator: (_rule: FormItemRule, value: string) =>
        value.trim().length >= 2,
      message: 'Title length cannot be less than 2 characters',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 80,
      message: 'Title length cannot exceed 80 characters',
      trigger: 'input',
    },
  ],
  content: [
    {
      validator: (_rule: FormItemRule, value: string) =>
        value.trim().length >= 2,
      message: 'Content length cannot be less than 2 characters',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 20_000,
      message: 'Content length cannot exceed 20,000 characters',
      trigger: 'input',
    },
  ],
  category: [
    {
      validator: (_rule: FormItemRule, value: string | undefined) =>
        value !== undefined,
      message: 'Please select a forum section to publish',
      trigger: 'input',
    },
  ],
};

store?.loadArticle()?.then((result) => {
  if (result.ok) {
    const { title, content, category } = result.value;
    formValue.value = {
      title,
      content,
      category,
    };
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

  if (store === undefined) {
    await doAction(
      Locator.articleRepository.createArticle(formValue.value).then((id) => {
        draftRepo.removeDraft(draftId);
        router.push({ path: `/forum/${id}` });
      }),
      'Publish',
      message,
    );
  } else {
    await doAction(
      store.updateArticle(formValue.value).then(() => {
        draftRepo.removeDraft(draftId);
        router.push({ path: `/forum/${articleId}` });
      }),
      'Update',
      message,
    );
  }
};
</script>

<template>
  <div class="layout-content">
    <n-h1>{{ articleId === undefined ? 'Publish' : 'Edit' }} Article</n-h1>
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="formRules"
      :label-placement="isWideScreen ? 'left' : 'top'"
      label-width="auto"
    >
      <n-form-item-row path="title" label="Title">
        <n-input
          v-model:value="formValue.title"
          placeholder="Please enter title"
          maxlength="80"
          show-count
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>
      <n-form-item-row path="category" label="Forum Section">
        <c-radio-group
          v-model:value="formValue.category"
          :options="articleCategoryOptions"
        />
      </n-form-item-row>
      <n-form-item-row path="content" label="Content">
        <MarkdownEditor
          mode="article"
          :draft-id="draftId"
          v-model:value="formValue.content"
          placeholder="Please enter content"
          :autosize="{ minRows: 8 }"
          maxlength="20000"
          style="width: 100%"
        />
      </n-form-item-row>
    </n-form>

    <c-button
      label="Submit"
      :icon="UploadOutlined"
      require-login
      size="large"
      type="primary"
      class="float"
      @action="submit"
    />
  </div>
</template>
