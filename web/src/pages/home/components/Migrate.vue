<script lang="ts" setup>
import { LSKey } from '@/data/LocalStorage';

const newDomain = 'https://n.novelia.cc';
const inOldDomain = location.hostname.includes('fishhawk');

const open = (url: string) => window.open(url);

window.addEventListener('message', (message) => {
  console.log('接收到消息', message);
  const { origin, data } = message;

  if (origin.endsWith('fishhawk.top') && data.type == 'migrate') {
    console.log('开始迁移数据', data);

    if (data.auth) localStorage.setItem(LSKey.Auth, data.auth);
    if (data.blacklist) localStorage.setItem(LSKey.Blacklist, data.blacklist);
    if (data.workspaceGpt)
      localStorage.setItem(LSKey.WorkspaceGpt, data.workspaceGpt);
    if (data.workspaceSakura)
      localStorage.setItem(LSKey.WorkspaceSakura, data.workspaceSakura);
    if (data.setting) localStorage.setItem(LSKey.Setting, data.setting);
    if (data.settingReader)
      localStorage.setItem(LSKey.SettingReader, data.settingReader);
    window.location.reload();
  }
});

if (inOldDomain && window.opener) {
  const msg = {
    type: 'migrate',
    auth: localStorage.getItem(LSKey.Auth),
    blacklist: localStorage.getItem(LSKey.Blacklist),
    workspaceGpt: localStorage.getItem(LSKey.WorkspaceGpt),
    workspaceSakura: localStorage.getItem(LSKey.WorkspaceSakura),
    setting: localStorage.getItem(LSKey.Setting),
    settingReader: localStorage.getItem(LSKey.SettingReader),
  };
  console.log('发送migrate消息');
  window.opener.postMessage(msg, 'https://n.novelia.cc');
  window.close();
}
</script>

<template>
  <n-p v-if="inOldDomain" style="margin: 0px 0px 4px">
    <b>
      Translation site has switched to new domain, will redirect by default at end of July
      <n-a href="https://n.novelia.cc/">{{ newDomain }}</n-a>
    </b>
  </n-p>
  <n-flex v-else style="margin: 0px 0px 8px">
    <c-button
      text
      size="small"
      type="warning"
      secondary
      label="Import settings from books"
      @click="open('https://books.fishhawk.top')"
      style="font-weight: 700"
    />
    /
    <c-button
      text
      size="small"
      type="warning"
      secondary
      label="Import settings from books1"
      @click="open('https://books1.fishhawk.top')"
      style="font-weight: 700"
    />
    /
    <c-button
      text
      size="small"
      type="warning"
      secondary
      tag="a"
      href="https://n.novelia.cc/files-extra/extension.v1.0.12.zip"
      label="Download browser extension (adapted for new domain)"
      style="font-weight: 700"
    />
  </n-flex>
</template>
