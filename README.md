# Light Novel Translation Robot

[![GPL-3.0](https://img.shields.io/github/license/auto-novel/auto-novel)](https://github.com/auto-novel/auto-novel#license)
[![CI-Server](https://github.com/auto-novel/auto-novel/workflows/CI-Server/badge.svg)](https://github.com/auto-novel/auto-novel/actions/workflows/CI-Server.yml)
[![CI-Web](https://github.com/auto-novel/auto-novel/workflows/CI-Web/badge.svg)](https://github.com/auto-novel/auto-novel/actions/workflows/CI-Web.yml)

> Rebuilding the Tower of Babel!!

[Light Novel Translation Robot](https://books.fishhawk.top/) is a website that automatically generates machine translations of light novels and shares them. Here, you can browse Japanese web novels/light novels, or upload your own EPUB/TXT files, and then generate machine-translated versions.

## Features

- Browse Japanese web novels, supported sites include: [Kakuyomu](https://kakuyomu.jp/), [Syosetu](https://syosetu.com/), [Novelup](https://novelup.plus/), [Hameln](https://syosetu.org/), [Pixiv](https://www.pixiv.net/), [Alphapolis](https://www.alphapolis.co.jp/).
- Generate multiple machine translations, supported translators include: Baidu, Youdao, OpenAI-like API (such as DeepSeek API), [Sakura](https://huggingface.co/SakuraLLM/Sakura-14B-Qwen2.5-v1.0-GGUF).
- Support for glossaries.
- Support for multiple formats, including Japanese, Chinese, and Japanese-Chinese comparison.
- Support for generating EPUB and TXT files.
- Support for translating EPUB and TXT files.
- Support for online reading.

## Contributing

Please refer to [CONTRIBUTING.md](https://github.com/auto-novel/auto-novel/blob/main/CONTRIBUTING.md)

<a href="https://next.ossinsight.io/widgets/official/compose-recent-top-contributors?repo_id=559577341" target="_blank" style="display: block" align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-recent-top-contributors/thumbnail.png?repo_id=559577341&image_size=auto&color_scheme=dark" width="280">
    <img alt="Top Contributors of ant-design/ant-design - Last 28 days" src="https://next.ossinsight.io/widgets/official/compose-recent-top-contributors/thumbnail.png?repo_id=559577341&image_size=auto&color_scheme=light" width="280">
  </picture>
</a>

## Deployment

> [!WARNING]
> Note: This project is not designed for personal deployment, and does not guarantee that all features are available and forward compatible.

Download the project:

```bash
> git clone https://github.com/auto-novel/auto-novel.git
> cd auto-novel
```

Create and edit the `.env` file with the following content:

```bash
DATA_PATH=./data                      # Data storage location
HTTPS_PROXY=https://127.0.0.1:7890    # Web novel proxy, can be empty
PIXIV_COOKIE_PHPSESSID=               # Pixiv cookies, can be left empty if not using Pixiv
```

Open the `docker-compose.yml` file and modify as needed.

Run `docker compose up [-d]` (`-d` for background running).

Visit `http://localhost` to access the application.
