# YUNNIAN Film

云辇汽车膜多语言官网源码。网站包含 53 个产品系列、404 张带固定编号的色卡、车型贴膜预览、型号规格表、技术文章、样品检测报告和采购询价入口。[中文官网](https://yunnianfilm.com/zh/) · [English website](https://yunnianfilm.com/)

## 本地运行

使用 Node.js 24、npm 和 Python 3.9 或更新版本。在项目根目录执行以下命令。

```sh
npm ci
npm run dev
```

终端会显示本地预览地址。英语入口为 `/`，简体中文为 `/zh/`，西班牙语为 `/es/`，法语为 `/fr/`，阿拉伯语为 `/ar/`。页首可以切换当前页面的语言。

## 构建

```sh
npm run build
node scripts/check_locales.mjs
npm run preview
```

`dist/` 是完整的网站构建目录，包含 Cloudflare Pages 所需的路由、重定向、站点地图、静态资源和客服 Worker。默认正式域名为 `https://yunnianfilm.com`。构建本身在本地完成。

## 主要目录

| 目录 | 内容 |
| --- | --- |
| `src/pages/` | 英文与简体中文页面 |
| `src/data/` | 产品系列、型号表、翻译、文章和资料索引 |
| `src/components/` | 产品筛选、色卡、询价和页面组件 |
| `public/automotive-studio/` | 3D 预览器、材质、色卡、环境及第三方署名 |
| `public/images/`、`public/videos/`、`public/downloads/` | 产品图片、介绍短片、采购资料和报告 |
| `public/support/`、`support/` | 客服界面、服务端源码、公开产品知识和数据库建表文件 |

首次预览或构建会从云辇官网取得 Aventador 车型文件并校验 SHA-256，后续使用本地缓存。已有相同文件时，可设置环境变量 `YUNNIAN_AVENTADOR_FILE` 指向该文件。另一款 Concept Coupe、色卡和其余展示素材随仓库提供。车型、字体、Three.js 和环境贴图的署名及授权说明位于各素材目录。[Aventador 来源](public/automotive-studio/CREDITS.txt) · [Concept Coupe 来源](public/automotive-studio/CREDITS-concept.txt)

## 在线客服

Cloudflare Pages 的客服 Worker 使用 D1 绑定 `SUPPORT_DB`。建表语句见 `support/schema.sql`。AI 模型服务读取运行环境中的 `GROQ_API_KEY`。本地查看产品、色卡和文章无需这些服务。
