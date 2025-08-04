<script lang="ts" setup>
import { UserRepository } from '@/data/api';
import { Result, runCatching } from '@/util/result';
import { Page } from '@/model/Page';
import { UserOutline, UserRole } from '@/model/User';

const userRole = ref<UserRole>('normal');
const userRoleOptions = [
  { value: 'normal', label: 'Normal User' },
  { value: 'maintainer', label: 'Maintainer' },
  { value: 'banned', label: 'Banned User' },
];

const currentPage = ref(1);
const pageNumber = ref(1);
const userResult = ref<Result<Page<UserOutline>>>();

async function loadPage(page: number) {
  userResult.value = undefined;
  const result = await runCatching(
    UserRepository.listUser({
      page: currentPage.value - 1,
      pageSize: 50,
      role: userRole.value,
    }),
  );
  if (currentPage.value == page) {
    userResult.value = result;
    if (result.ok) {
      pageNumber.value = result.value.pageNumber;
    }
  }
}

watch(currentPage, (page) => loadPage(page), { immediate: true });

watch(userRole, () => {
  if (currentPage.value === 1) loadPage(1);
  else currentPage.value = 1;
});

const roleToReadableText = (role: UserRole) => {
  if (role === 'normal') return 'Normal User';
  else if (role === 'trusted') return 'Trusted User';
  else if (role === 'maintainer') return 'Maintainer';
  else if (role === 'admin') return 'Administrator';
  else if (role === 'banned') return 'Banned User';
  else return 'Unknown';
};
</script>

<template>
  <n-p>
    <c-radio-group v-model:value="userRole" :options="userRoleOptions" />
  </n-p>

  <n-pagination
    v-if="pageNumber > 1"
    v-model:page="currentPage"
    :page-count="pageNumber"
    :page-slot="7"
  />
  <n-divider />

  <c-result
    :result="userResult"
    :show-empty="(it: Page<any>) => it.items.length === 0"
    v-slot="{ value }"
  >
    <n-table :bordered="false">
      <thead>
        <tr>
          <th style="width: 150px"><b>Username</b></th>
          <th style="width: 80px"><b>Role</b></th>
          <th style="width: 150px"><b>Email</b></th>
          <th style="width: 150px"><b>Created At</b></th>
          <th><b>Operations</b></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in value.items" :key="user.id">
          <td>{{ user.username }}</td>
          <td>{{ roleToReadableText(user.role) }}</td>
          <td>{{ user.email }}</td>
          <td><n-time :time="user.createdAt * 1000" /></td>
          <td>
            <user-management-update-role
              :id="user.id"
              :username="user.username"
              :role="user.role"
              @update="loadPage(currentPage)"
            />
          </td>
        </tr>
      </tbody>
    </n-table>
  </c-result>

  <n-divider />
  <n-pagination
    v-if="pageNumber > 1"
    v-model:page="currentPage"
    :page-count="pageNumber"
    :page-slot="7"
  />
</template>
