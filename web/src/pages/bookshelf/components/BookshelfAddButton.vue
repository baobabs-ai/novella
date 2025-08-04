<script lang="ts" setup>
import { PlusOutlined } from '@vicons/material';
import { FormInst, FormItemRule, FormRules } from 'naive-ui';

import { Locator } from '@/data';

import { doAction } from '@/pages/util';

const message = useMessage();

const favoredRepository = Locator.favoredRepository();

const showAddModal = ref(false);

const formRef = ref<FormInst>();
const formValue = ref<{
  title: string;
  type: 'web' | 'wenku' | 'local';
}>({
  title: '',
  type: 'web',
});
const formRules: FormRules = {
  title: [
    {
      validator: (_rule: FormItemRule, value: string) => value.length > 0,
      message: 'Collection title cannot be empty',
      trigger: 'input',
    },
    {
      validator: (_rule: FormItemRule, value: string) => value.length <= 20,
      message: 'Collection title cannot exceed 20 characters',
      trigger: 'input',
    },
  ],
};

const addFavorite = async () => {
  try {
    await formRef.value?.validate();
  } catch (e) {
    return;
  }

  const { type, title } = formValue.value;
  await doAction(
    favoredRepository.createFavored(type, title).then(() => {
      showAddModal.value = false;
    }),
    'Collection created',
    message,
  );
};
</script>

<template>
  <c-button label="Create" :icon="PlusOutlined" @action="showAddModal = true" />

  <c-modal title="Create Collection" v-model:show="showAddModal">
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
    >
      <n-form-item-row label="Title" path="title">
        <n-input
          v-model:value="formValue.title"
          placeholder="Collection title"
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>

      <n-form-item-row label="Type">
        <c-radio-group
          v-model:value="formValue.type"
          :options="[
            { label: 'Web Novels', value: 'web' },
            { label: 'Light Novels', value: 'wenku' },
            { label: 'Local Novels', value: 'local' },
          ]"
        />
      </n-form-item-row>
    </n-form>

    <template #action>
      <c-button
        label="Confirm"
        require-login
        type="primary"
        @action="addFavorite"
      />
    </template>
  </c-modal>
</template>
