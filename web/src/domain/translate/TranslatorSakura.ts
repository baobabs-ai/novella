import { Locator } from '@/data';
import { Glossary } from '@/model/Glossary';

import {
  Logger,
  SegmentContext,
  SegmentTranslator,
  createLengthSegmentor,
} from './Common';

export class SakuraTranslator implements SegmentTranslator {
  id = <const>'sakura';
  log: (message: string, detail?: string[]) => void;
  private api;
  version: string = '0.9';
  model?: {
    id: string;
    meta: SakuraTranslator.ModelMeta;
  };
  segmentor = createLengthSegmentor(500);
  segLength = 500;
  prevSegLength = 500;

  constructor(
    log: Logger,
    { endpoint, segLength, prevSegLength }: SakuraTranslator.Config,
  ) {
    this.log = log;
    this.api = Locator.openAiRepositoryFactory(endpoint, 'no-key');
    if (segLength !== undefined) {
      this.segmentor = createLengthSegmentor(segLength);
      this.segLength = segLength;
    }
    if (prevSegLength !== undefined) {
      this.prevSegLength = prevSegLength;
    }
  }

  async init() {
    this.model = (await this.detectModel()) as typeof this.model;
    const id = this.model?.id;
    if (id !== undefined) {
      if (id.includes('0.8')) this.version = '0.8';
      else if (id.includes('0.9')) this.version = '0.9';
      else if (id.includes('0.10')) this.version = '0.10';
      else if (id.includes('1.0')) this.version = '1.0';
    }
    console.log('Model:');
    console.log(this.model);
    return this;
  }

  allowUpload = () => {
    if (this.segLength !== 500) {
      this.log('Segment length is not 500');
      return false;
    }
    if (this.prevSegLength !== 500) {
      this.log('Previous segment length is not 500');
      return false;
    }

    if (this.model === undefined) {
      this.log('Unable to get model data');
      return false;
    }

    const metaCurrent = this.model.meta;
    const metaExpected = SakuraTranslator.allowModels[this.model.id]?.meta;
    if (metaExpected === undefined) {
      this.log(`Model is ${this.model.id}, upload prohibited`);
      return false;
    }

    for (const key in metaExpected) {
      if (metaCurrent[key] !== metaExpected[key]) {
        this.log(`Model check failed, do not try to deceive model check`);
        return false;
      }
    }
    this.log(`Model is ${this.model.id}, upload allowed`);
    return true;
  };

  async translate(
    seg: string[],
    { glossary, prevSegs, signal }: SegmentContext,
  ): Promise<string[]> {
    const concatedSeg = seg.join('\n');
    const prevSegCount = -Math.ceil(this.prevSegLength / this.segLength);

    const concatedPrevSeg =
      prevSegCount === 0 ? '' : prevSegs.slice(prevSegCount).flat().join('\n');

    // 正常翻译
    let retry = 1;
    while (retry < 3) {
      const { text, hasDegradation } = await this.createChatCompletions(
        concatedSeg,
        glossary,
        concatedPrevSeg,
        signal,
        retry > 1,
      );
      const splitText = text.replaceAll('<|im_end|>', '').split('\n');

      const parts: string[] = [`第${retry}次`];
      const linesNotMatched = seg.length !== splitText.length;
      if (hasDegradation) {
        parts.push('退化');
      } else if (linesNotMatched) {
        parts.push('行数不匹配');
      } else {
        parts.push('成功');
      }
      const detail = [seg.join('\n'), text];
      this.log(parts.join('　'), detail);

      if (!hasDegradation && !linesNotMatched) {
        return splitText;
      } else {
        retry += 1;
      }
    }

    // 逐行翻译
    {
      this.log('逐行翻译');
      let degradationLineCount = 0;
      const resultPerLine = [];
      for (const line of seg) {
        const { text, hasDegradation } = await this.createChatCompletions(
          line,
          glossary,
          [concatedPrevSeg, ...resultPerLine].join('\n'),
          signal,
          true,
        );
        if (hasDegradation) {
          degradationLineCount += 1;
          this.log(`单行退化${degradationLineCount}次`, [line, text]);
          if (degradationLineCount >= 2) {
            throw Error('单个分段有2行退化，Sakura翻译器可能存在异常');
          } else {
            resultPerLine.push(line);
          }
        } else {
          resultPerLine.push(text.replaceAll('<|im_end|>', ''));
        }
      }
      return resultPerLine;
    }
  }

  private async detectModel() {
    const modelsPage = await this.api
      .listModels({
        headers: {
          'ngrok-skip-browser-warning': '69420',
        },
      })
      .catch((e) => {
        this.log(`获取模型数据失败：${e}`);
      });
    const model = modelsPage?.data[0];
    if (model === undefined) {
      return undefined;
    }
    return { id: model.id.replace(/(.gguf)$/, ''), meta: model.meta };
  }

  private async createChatCompletions(
    text: string,
    glossary: Glossary,
    prevText: string,
    signal?: AbortSignal,
    hasDegradation?: boolean,
  ) {
    const messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [];

    const system = (content: string) => {
      messages.push({ role: 'system', content });
    };
    const user = (content: string) => {
      messages.push({ role: 'user', content });
    };
    const assistant = (content: string) => {
      messages.push({ role: 'assistant', content });
    };

    // 全角数字转换成半角数字
    text = text.replace(/[\uff10-\uff19]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    );

    if (this.version === '1.0') {
      system(
        'You are a light novel translation model that can fluently and smoothly translate Japanese into English in the style of Japanese light novels, and correctly use personal pronouns in context without arbitrarily adding pronouns that are not in the original text.',
      );
      if (prevText !== '') {
        assistant(prevText);
      }

      if (Object.keys(glossary).length === 0) {
        user(`Translate the following Japanese text into English: ${text}`);
      } else {
        const glossaryHint = Object.entries(glossary)
          .map(([wordJp, wordZh]) => `${wordJp}->${wordZh}`)
          .join('\n');
        user(
          `Based on the following glossary (can be empty):\n${glossaryHint}\n` +
            `Translate the following Japanese text into English according to the corresponding relationships and notes: ${text}`,
        );
      }
    } else if (this.version === '0.10') {
      system(
        'You are a light novel translation model that can fluently and smoothly use the given glossary to translate Japanese into English in the style of Japanese light novels, and correctly use personal pronouns in context, paying attention not to confuse the subject and object of causative and passive forms, do not arbitrarily add pronouns that are not in the original text, and do not arbitrarily add or reduce line breaks.',
      );
      if (prevText !== '') {
        assistant(prevText);
      }

      const glossaryHint = Object.entries(glossary)
        .map(([wordJp, wordZh]) => `${wordJp}->${wordZh}`)
        .join('\n');

      user(
        `Based on the following glossary (can be empty):\n${glossaryHint}\n\nTranslate the following Japanese text into English according to the corresponding relationships and notes in the above glossary: ${text}`,
      );
    } else {
      system(
        'You are a light novel translation model that can fluently and smoothly translate Japanese into English in the style of Japanese light novels, and correctly use personal pronouns in context without arbitrarily adding pronouns that are not in the original text.',
      );
      if (prevText !== '') {
        assistant(prevText);
      }

      // Replace glossary vocabulary
      for (const wordJp of Object.keys(glossary).sort(
        (a, b) => b.length - a.length,
      )) {
        const wordZh = glossary[wordJp];
        text = text.replaceAll(wordJp, wordZh);
      }

      user(`Translate the following Japanese text into English: ${text}`);
    }

    const maxNewToken = Math.max(Math.ceil(text.length * 1.7), 100);
    const completion = await this.api.createChatCompletions(
      {
        model: '',
        messages,
        temperature: 0.1,
        top_p: 0.3,
        max_tokens: maxNewToken,
        frequency_penalty: hasDegradation ? 0.2 : 0.0,
      },
      {
        signal,
        timeout: false,
      },
    );

    return {
      text: completion.choices[0].message.content!,
      hasDegradation: completion.usage.completion_tokens >= maxNewToken,
    };
  }
}

export namespace SakuraTranslator {
  export interface Config {
    endpoint: string;
    segLength?: number;
    prevSegLength?: number;
  }
  export const create = (log: Logger, config: Config) =>
    new SakuraTranslator(log, config).init();

  export type ModelMeta = Record<string, number>;
  export const allowModels: {
    [key: string]: { repo: string; meta: ModelMeta };
  } = {
    'sakura-14b-qwen2.5-v1.0-iq4xs': {
      repo: 'SakuraLLM/Sakura-14B-Qwen2.5-v1.0-GGUF',
      meta: {
        vocab_type: 2,
        n_vocab: 152064,
        n_ctx_train: 131072,
        n_embd: 5120,
        n_params: 14770033664,
        size: 8180228096,
      },
    },
    'sakura-14b-qwen2.5-v1.0-q6k': {
      repo: 'SakuraLLM/Sakura-14B-Qwen2.5-v1.0-GGUF',
      meta: {
        vocab_type: 2,
        n_vocab: 152064,
        n_ctx_train: 131072,
        n_embd: 5120,
        n_params: 14770033664,
        size: 12118716416,
      },
    },
    'sakura-14b-qwen2beta-v0.9.2-iq4xs': {
      repo: 'SakuraLLM/Sakura-14B-Qwen2beta-v0.9.2-GGUF',
      meta: {
        vocab_type: 2,
        n_vocab: 152064,
        n_ctx_train: 32768,
        n_embd: 5120,
        n_params: 14167290880,
        size: 7908392960,
      },
    },
    'sakura-32b-qwen2beta-v0.9-iq4xs': {
      repo: 'SakuraLLM/Sakura-32B-Qwen2beta-v0.9-GGUF',
      meta: {
        vocab_type: 2,
        n_vocab: 152064,
        n_ctx_train: 32768,
        n_embd: 5120,
        n_params: 32512218112,
        size: 17728790528,
      },
    },
  };
}
