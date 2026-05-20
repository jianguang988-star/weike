# 阿广的外挂

房产销售专属 AI 客户管理系统 V1 MVP。系统独立运行，客户数据保存在本地 SQLite 数据库中，AI 服务通过 Provider 适配层调用，默认使用 mock-provider 跑通流程。

## 技术栈

- Next.js + TypeScript
- Tailwind CSS
- SQLite + Prisma
- AI Provider 适配层

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 创建环境变量

```bash
cp .env.example .env
```

3. 初始化数据库

```bash
npm run prisma:migrate -- --name init
```

4. 启动开发服务

```bash
npm run dev
```

访问 http://localhost:3000

## 切换 AI Provider

默认：

```env
AI_PROVIDER="mock"
```

使用 OpenAI：

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="你的 key"
OPENAI_MODEL="gpt-4o-mini"
```

使用 DeepSeek：

```env
AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="你的 DeepSeek API Key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

业务代码只调用 `lib/ai/provider.ts`，后续可继续增加 DeepSeek、Claude、Gemini、通义千问或本地模型 Provider。

