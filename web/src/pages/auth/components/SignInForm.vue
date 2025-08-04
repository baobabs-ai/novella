<script lang="ts" setup>
import { FormInst, FormItemRule, FormRules } from 'naive-ui';

import { Locator, formatError } from '@/data';

const loadingBar = useLoadingBar();
const message = useMessage();

const formRef = ref<FormInst>();

const formValue = ref({
  emailOrUsername: '',
  password: '',
});

const formRules: FormRules = {
  emailOrUsername: [
    {
      validator: (_rule: FormItemRule, value: string) => value.length > 0,
      message: 'Email/Username cannot be empty',
      trigger: 'input',
    },
  ],
  password: [
    {
      validator: (_rule: FormItemRule, value: string) => value.length >= 8,
      message: 'Password must be at least 8 characters',
      trigger: 'input',
    },
  ],
};

const signIn = async () => {
  try {
    await formRef.value?.validate();
  } catch (e) {
    return;
  }
  loadingBar.start();
  try {
    await Locator.authRepository().signIn(formValue.value);
    loadingBar.finish();
  } catch (e) {
    loadingBar.error();
    message.error('Login failed:' + (await formatError(e)));
  }
};
</script>

<template>
  <n-form
    ref="formRef"
    :model="formValue"
    :rules="formRules"
    label-placement="left"
    label-width="auto"
  >
    <n-form-item-row path="emailOrUsername">
      <n-input
        v-model:value="formValue.emailOrUsername"
        placeholder="Username/Email"
        :input-props="{ spellcheck: false }"
      />
    </n-form-item-row>
    <n-form-item-row path="password">
      <n-input
        v-model:value="formValue.password"
        type="password"
        show-password-on="click"
        placeholder="Password"
        @keyup.enter="signIn()"
      />
    </n-form-item-row>
  </n-form>

  <c-a :to="{ name: 'reset-password' }">Forget Password</c-a>
  <n-button type="primary" block @click="signIn" style="margin-top: 20px">
    Sign In
  </n-button>
</template>
