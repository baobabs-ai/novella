<script lang="ts" setup>
import { UserRepository } from '@/data/api';
import { UserRole } from '@/model/User';
import { doAction } from '@/pages/util';

const props = defineProps<{
  id: string;
  username: string;
  role: UserRole;
}>();

const emit = defineEmits<{
  update: [];
}>();

const userRole = ref<UserRole>(props.role);

const showActionModal = ref(false);

const message = useMessage();

const userRoleOptions = [
  { value: 'normal', label: 'Normal User' },
  { value: 'maintainer', label: 'Maintainer' },
  { value: 'banned', label: 'Banned User' },
];

const submitRole = () => {
  doAction(
    UserRepository.updateRole(props.id, { role: userRole.value }),
    `Update ${props.username} permission`,
    message,
  );
  showActionModal.value = false;
  emit('update');
};

const toggleActionModal = () => {
  showActionModal.value = !showActionModal.value;
};
</script>

<template>
  <c-button :label="`Update Permission`" v-bind="$attrs" @action="toggleActionModal()" />

  <c-modal
    :title="`Update ${username} Permission`"
    v-model:show="showActionModal"
    :extra-height="120"
  >
    <n-flex vertical size="large" style="max-width: 400px; margin-bottom: 32px">
      <c-radio-group
        v-model:value="userRole"
        :options="userRoleOptions"
        size="large"
      />
    </n-flex>
    <template #action>
      <c-button label="Submit" type="primary" @action="submitRole()" />
    </template>
  </c-modal>
</template>
