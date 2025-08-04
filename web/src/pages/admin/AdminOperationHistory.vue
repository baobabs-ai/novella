<script lang="ts" setup>
import { OperationRepository } from '@/data/api';
import { Result, runCatching } from '@/util/result';
import { OperationHistory, OperationType } from '@/model/Operation';
import { Page } from '@/model/Page';
import { doAction } from '@/pages/util';

import OperationWenkuEdit from './components/OperationWenkuEdit.vue';
import OperationWenkuUpload from './components/OperationWenkuUpload.vue';

const type = ref<OperationType>('web-edit');
const typeOptions = [
  { value: 'web-edit', label: 'Network Edit' },
  { value: 'web-edit-glossary', label: 'Network Edit Glossary' },
  { value: 'wenku-edit', label: 'Light Novel Edit' },
  { value: 'wenku-edit-glossary', label: 'Light Novel Edit Glossary' },
  { value: 'wenku-upload', label: 'Light Novel Upload' },
];

const message = useMessage();

const currentPage = ref(1);
const pageNumber = ref(1);
const historiesResult = ref<Result<Page<OperationHistory>>>();

async function loadPage(page: number) {
  historiesResult.value = undefined;
  const result = await runCatching(
    OperationRepository.listOperationHistory({
      page: currentPage.value - 1,
      pageSize: 30,
      type: type.value,
    }),
  );
  if (currentPage.value == page) {
    historiesResult.value = result;
    if (result.ok) {
      pageNumber.value = result.value.pageNumber;
    }
  }
}

const deleteHistory = (id: string) =>
  doAction(
    OperationRepository.deleteOperationHistory(id).then(() => {
      if (historiesResult.value?.ok) {
        historiesResult.value.value.items =
          historiesResult.value.value.items.filter((it) => it.id !== id);
      }
    }),
    'Delete',
    message,
  );

watch(currentPage, (page) => loadPage(page), { immediate: true });

watch(type, () => {
  if (currentPage.value === 1) loadPage(1);
  else currentPage.value = 1;
});
</script>

<template>
  <n-p>
    <c-radio-group v-model:value="type" :options="typeOptions" />
  </n-p>

  <n-pagination
    v-if="pageNumber > 1"
    v-model:page="currentPage"
    :page-count="pageNumber"
    :page-slot="7"
  />
  <n-divider />

  <c-result
    :result="historiesResult"
    :show-empty="(it: Page<any>) => it.items.length === 0"
    v-slot="{ value }"
  >
    <n-list>
      <n-list-item v-for="item in value.items" :key="item.id">
        <operation-web-edit
          v-if="item.operation.type === 'web-edit'"
          :op="item.operation"
        />
        <operation-web-edit-glossary
          v-else-if="item.operation.type === 'web-edit-glossary'"
          :op="item.operation"
        />
        <operation-wenku-edit
          v-else-if="item.operation.type === 'wenku-edit'"
          :op="item.operation"
        />
        <operation-wenku-edit-glossary
          v-else-if="item.operation.type === 'wenku-edit-glossary'"
          :op="item.operation"
        />
        <operation-wenku-upload
          v-else-if="item.operation.type === 'wenku-upload'"
          :op="item.operation"
        />
        <n-flex>
          <n-text>
            At
            <n-time :time="item.createAt * 1000" type="relative" />
            by {{ item.operator.username }}
          </n-text>
          <n-button type="error" text @click="deleteHistory(item.id)">
            Delete
          </n-button>
        </n-flex>
      </n-list-item>
    </n-list>
  </c-result>

  <n-divider />
  <n-pagination
    v-if="pageNumber > 1"
    v-model:page="currentPage"
    :page-count="pageNumber"
    :page-slot="7"
  />
</template>
