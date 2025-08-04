<script lang="ts" setup>
import { MoreVertOutlined } from '@vicons/material';
import { FormInst, FormItemRule, FormRules } from 'naive-ui';

import { Locator } from '@/data';

import { doAction } from '@/pages/util';
import { useBookshelfLocalStore } from '../BookshelfLocalStore';

const { id, type, title } = defineProps<{
  id: string;
  title: string;
  type: 'web' | 'wenku' | 'local';
}>();

const favoredRepository = Locator.favoredRepository();
const store = useBookshelfLocalStore();

const message = useMessage();

const getOptions = () => {
  if (id === 'all') {
    return [];
  } else if (id === 'default') {
    return [{ label: 'Edit Information', key: 'edit' }];
  } else {
    return [
      { label: 'Edit Information', key: 'edit' },
      { label: 'Delete', key: 'delete' },
    ];
  }
};

const options = getOptions();

const onSelect = (key: string) => {
  if (key === 'edit') {
    showEditModal.value = true;
  } else if (key === 'delete') {
    showDeleteModal.value = true;
  }
};

const showEditModal = ref(false);
const formRef = ref<FormInst | null>(null);
const formValue = ref({ title });
const formRules: FormRules = {
  title: [
    {
      validator: (_rule: FormItemRule, value: string) => value.length > 0,
      message: 'Collection title cannot be empty',
      trigger: 'input',
    },
  ],
};
const updateFavored = async () => {
  if (formRef.value == null) {
    return;
  } else {
    try {
      await formRef.value.validate();
    } catch (e) {
      return;
    }
  }

  const title = formValue.value.title;

  await doAction(
    favoredRepository.updateFavored(type, id, title).then(() => {
      showEditModal.value = false;
    }),
    'Collection updated',
    message,
  );
};

const deleteFavoredNovels = async () => {
  if (type === 'local') {
    const { failed } = await store.deleteVolumes(
      store.volumes.filter((it) => it.favoredId === id).map(({ id }) => id),
    );
    if (failed > 0) {
      throw new Error(`Failed to clear collection, ${failed} novels not deleted`);
    }
  }
};

const showDeleteModal = ref(false);
const deleteFavored = () =>
  doAction(
    deleteFavoredNovels()
      .then(() => favoredRepository.deleteFavored(type, id))
      .then(() => (showDeleteModal.value = false)),
    'Collection deleted',
    message,
  );
</script>

<template>
  <router-link :to="`/favorite/${type}/${id}`">
    <n-flex align="center" justify="space-between">
      {{ title }}
      <n-dropdown
        v-if="options.length > 0"
        trigger="hover"
        :options="options"
        :keyboard="false"
        @select="onSelect"
      >
        <n-button quaternary circle>
          <n-icon :component="MoreVertOutlined" />
        </n-button>
      </n-dropdown>
    </n-flex>
  </router-link>

  <c-modal v-model:show="showEditModal" title="Edit Collection">
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
          placeholder="Collection Title"
          :input-props="{ spellcheck: false }"
        />
      </n-form-item-row>
    </n-form>

    <template #action>
      <c-button
        label="Confirm"
        require-login
        type="primary"
        @action="updateFavored"
      />
    </template>
  </c-modal>

  <c-modal v-model:show="showDeleteModal" title="Delete Collection">
    Are you sure you want to delete collection [{{ title }}]?
    <n-text v-if="type === 'local'">
      <br />
      Note: Deleting the local collection will also clear all novels in the collection.
    </n-text>

    <template #action>
      <c-button
        label="Confirm"
        require-login
        type="primary"
        @action="deleteFavored"
      />
    </template>
  </c-modal>
</template>
