<script lang="ts" setup>
import { Locator } from '@/data';
import { ReaderSetting } from '@/data/setting/Setting';
import { checkIsMobile, useIsWideScreen } from '@/pages/util';

const isMobile = checkIsMobile();
const isWideScreen = useIsWideScreen(600);
const { setting } = Locator.readerSettingRepository();

const setCustomBodyColor = (color: string) =>
  (setting.value.theme.bodyColor = color);
const setCustomFontColor = (color: string) =>
  (setting.value.theme.fontColor = color);
</script>

<template>
  <c-modal content-style="padding: 0;" :max-height-percentage="80">
    <n-tabs
      type="line"
      size="large"
      :tabs-padding="20"
      pane-style="padding: 0px;"
      animated
      style="width: 100%"
    >
      <n-tab-pane name="signin" tab="Content">
        <n-flex vertical size="large" style="width: 100%; padding: 20px">
          <c-action-wrapper title="Language">
            <c-radio-group
              v-model:value="setting.mode"
              :options="ReaderSetting.modeOptions"
            />
          </c-action-wrapper>

          <c-action-wrapper title="Translation">
            <n-flex size="large">
              <c-radio-group
                v-model:value="setting.translationsMode"
                :options="ReaderSetting.translationModeOptions"
              />
              <translator-check
                v-model:value="setting.translations"
                show-order
                :two-line="!isWideScreen"
              />
            </n-flex>
          </c-action-wrapper>

          <c-action-wrapper v-if="isMobile" title="Click Area">
            <c-radio-group
              v-model:value="setting.clickArea"
              :options="ReaderSetting.clickAreaOptions"
            />
          </c-action-wrapper>

          <c-action-wrapper title="Read Language">
            <c-radio-group
              :value="setting.speakLanguages[0]"
              @update-value="(it) => (setting.speakLanguages = [it])"
              :options="ReaderSetting.speakLanguagesOptions"
            />
          </c-action-wrapper>
          <c-action-wrapper v-if="isMobile" title="Click Animation" align="center">
            <n-switch
              v-model:value="setting.enableClickAnimition"
              size="small"
            />
          </c-action-wrapper>
          <c-action-wrapper title="Show Translation Source" align="center">
            <n-switch v-model:value="setting.enableSourceLabel" size="small" />
          </c-action-wrapper>
          <c-action-wrapper title="Trim Indentation" align="center">
            <n-switch v-model:value="setting.trimLeadingSpaces" size="small" />
          </c-action-wrapper>

          <n-text depth="3" style="font-size: 12px">
            # Left/Right arrow keys to navigate chapters, number keys 1-4 to switch translations
          </n-text>
        </n-flex>
      </n-tab-pane>

      <n-tab-pane name="signup" tab="Style">
        <n-flex vertical size="large" style="width: 100%; padding: 20px">
          <c-action-wrapper title="Font Weight">
            <c-radio-group
              v-model:value="setting.fontWeight"
              :options="ReaderSetting.fontWeightOptions"
            />
          </c-action-wrapper>

          <c-action-wrapper title="Font Size" align="center">
            <n-slider
              v-model:value="setting.fontSize"
              :min="14"
              :max="40"
              style="flex: auto"
              :format-tooltip="(value: number) => `${value}px`"
            />
            <n-text style="width: 6em">{{ setting.fontSize }}px</n-text>
          </c-action-wrapper>

          <c-action-wrapper title="Line Space" align="center">
            <n-slider
              v-model:value="setting.lineSpace"
              :step="0.1"
              :min="0"
              :max="2"
              style="flex: auto"
              :format-tooltip="(value: number) => value.toFixed(1)"
            />
            <n-text style="width: 6em">
              {{ setting.lineSpace.toFixed(1) }}
            </n-text>
          </c-action-wrapper>

          <c-action-wrapper title="Page Width" align="center">
            <n-slider
              v-model:value="setting.pageWidth"
              :step="50"
              :min="600"
              :max="1200"
              style="flex: auto"
              :format-tooltip="(value: number) => `${value}px`"
            />
            <n-text style="width: 6em">{{ setting.pageWidth }}px</n-text>
          </c-action-wrapper>

          <c-action-wrapper title="Underline">
            <c-radio-group
              v-model:value="setting.textUnderline"
              :options="ReaderSetting.textUnderlineOptions"
            />
          </c-action-wrapper>

          <c-action-wrapper title="Theme">
            <n-flex size="large" vertical>
              <c-radio-group
                v-model:value="setting.theme.mode"
                :options="ReaderSetting.themeModeOptions"
              />
              <template v-if="setting.theme.mode === 'custom'">
                <n-flex>
                  <n-radio
                    v-for="theme of ReaderSetting.themeOptions"
                    :key="theme.bodyColor"
                    :checked="theme.bodyColor == setting.theme.bodyColor"
                    @update:checked="
                      setting.theme = { mode: 'custom', ...theme }
                    "
                  >
                    <n-tag
                      :color="{
                        color: theme.bodyColor,
                        textColor: theme.fontColor,
                      }"
                      :style="{
                        width: isWideScreen ? '5.5em' : '2em',
                      }"
                    >
                      {{ isWideScreen ? theme.bodyColor : '#' }}
                    </n-tag>
                  </n-radio>
                </n-flex>
                <n-divider style="margin: 0px" />
                <n-flex>
                  <n-color-picker
                    :modes="['hex']"
                    :show-alpha="false"
                    :default-value="setting.theme.bodyColor"
                    :on-complete="setCustomBodyColor"
                    style="width: 8.2em"
                  >
                    <template #label="color">Background: {{ color }}</template>
                  </n-color-picker>
                  <n-color-picker
                    :modes="['hex']"
                    :show-alpha="false"
                    :default-value="setting.theme.fontColor"
                    :on-complete="setCustomFontColor"
                    style="width: 8.2em"
                  >
                    <template #label="color">Text: {{ color }}</template>
                  </n-color-picker>
                </n-flex>
              </template>
            </n-flex>
          </c-action-wrapper>

          <c-action-wrapper title="Main Opacity" align="center">
            <n-slider
              v-model:value="setting.mixZhOpacity"
              :max="1"
              :min="0"
              :step="0.05"
              :format-tooltip="
                (value: number) => `${(value * 100).toFixed(0)}%`
              "
              style="flex: auto"
            />
            <n-text style="width: 6em">
              {{ (setting.mixZhOpacity * 100).toFixed(0) }}%
            </n-text>
          </c-action-wrapper>

          <c-action-wrapper title="Secondary Opacity" align="center">
            <n-slider
              v-model:value="setting.mixJpOpacity"
              :max="1"
              :min="0"
              :step="0.05"
              :format-tooltip="
                (value: number) => `${(value * 100).toFixed(0)}%`
              "
            />
            <n-text style="width: 6em">
              {{ (setting.mixJpOpacity * 100).toFixed(0) }}%
            </n-text>
          </c-action-wrapper>
        </n-flex>
      </n-tab-pane>
    </n-tabs>
  </c-modal>
</template>
