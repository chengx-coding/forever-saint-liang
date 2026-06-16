[English](README.md) | [中文](README.zh-CN.md)

# 梁圣的恩情还不完: Websearch MCP via Deepseek

一个基于 DeepSeek Anthropic 兼容 API 提供网络搜索能力的 MCP 服务端。

永铭圣良之恩。

## 前置条件

- Node.js >= 18
- DeepSeek API Key，从 https://platform.deepseek.com 获取

## 安装

```bash
npm install -g forever-saint-liang-websearch
```

首次运行时，会自动在 `~/.config/.websearch-via-deepseek/settings.json` 创建用户配置文件。

## 快速开始

### 1. 设置 API Key

通过环境变量设置：

```bash
export DEEPSEEK_API_KEY="sk-your-api-key"
```

或编辑 `~/.config/.websearch-via-deepseek/settings.json`，填入 `apiKey`。

### 2. 配置 MCP 客户端

**OpenCode** (`opencode.json`)：

```json
{
  "mcp": {
    "forever-saint-liang-websearch": {
      "type": "local",
      "enabled": true,
      "command": ["npx", "forever-saint-liang-websearch"],
      "environment": {
        "DEEPSEEK_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

**Claude Code** (`claude_desktop_config.json` / `.mcp.json`)：

```json
{
  "mcpServers": {
    "forever-saint-liang-websearch": {
      "command": "npx",
      "args": ["forever-saint-liang-websearch"],
      "env": {
        "DEEPSEEK_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```
```

## 配置

配置加载优先级（从高到低）：

1. **命令行参数** — `--api-key=sk-... --model=deepseek-v4-pro`
2. **环境变量** — `WEBSEARCH_MODEL`、`WEBSEARCH_ENDPOINT` 等
3. **用户配置文件** — `~/.config/.websearch-via-deepseek/settings.json`
4. **默认值** — 内置于服务端

### 配置文件 (`settings.json`)

```json
{
  "apiKey": "",
  "endpoint": "https://api.deepseek.com/anthropic/v1/messages",
  "model": "deepseek-v4-flash",
  "maxTokens": 32768,
  "systemPrompt": "Use multiple keyword variations to conduct thorough research. Prioritize authoritative, verifiable sources. Provide comprehensive, well-cited answers.",
  "tool": {
    "name": "web_search",
    "type": "web_search_20260209",
    "max_uses": 20
  }
}
```

| 键 | 默认值 | 说明 |
|---|--------|------|
| `apiKey` | (留空) | DeepSeek API 密钥 |
| `endpoint` | `https://api.deepseek.com/anthropic/v1/messages` | API 端点 URL |
| `model` | `deepseek-v4-flash` | 模型：`deepseek-v4-flash` 或 `deepseek-v4-pro` |
| `maxTokens` | `32768` | 最大输出 token 数 |
| `systemPrompt` | (见默认值) | 引导搜索行为的系统提示词 |
| `tool.name` | `"web_search"` | MCP 中注册的工具名称 |
| `tool.type` | `"web_search_20260209"` | DeepSeek 工具类型 |
| `tool.max_uses` | `20` | 每次请求最大搜索调用次数 |

### 环境变量

| 变量 | 对应配置项 |
|------|-----------|
| `DEEPSEEK_API_KEY` | `apiKey` |
| `WEBSEARCH_API_KEY` | `apiKey`（备选） |
| `WEBSEARCH_ENDPOINT` | `endpoint` |
| `WEBSEARCH_MODEL` | `model` |
| `WEBSEARCH_MAX_TOKENS` | `maxTokens` |
| `WEBSEARCH_SYSTEM_PROMPT` | `systemPrompt` |
| `WEBSEARCH_TOOL_NAME` | `tool.name` |
| `WEBSEARCH_TOOL_TYPE` | `tool.type` |
| `WEBSEARCH_MAX_USES` | `tool.max_uses` |

### 命令行参数

```bash
forever-saint-liang-websearch --api-key=sk-... --model=deepseek-v4-pro
```

| 参数 | 配置项 |
|------|--------|
| `--api-key` | `apiKey` |
| `--endpoint` | `endpoint` |
| `--model` | `model` |
| `--max-tokens` | `maxTokens` |
| `--system-prompt` | `systemPrompt` |
| `--tool-name` | `tool.name` |
| `--tool-type` | `tool.type` |
| `--max-uses` | `tool.max_uses` |

## 工具：`web_search`

使用 DeepSeek 内置网络搜索进行搜索。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | — | 搜索关键词（1-500 字符） |
| `max_uses` | number | 否 | 5 | 最大搜索调用次数（受服务端 `tool.max_uses` 限制） |
| `allowed_domains` | string[] | 否 | — | 仅返回指定域名的结果 |
| `blocked_domains` | string[] | 否 | — | 排除指定域名的结果 |
| `user_location` | object | 否 | — | 本地化结果：`{ city?, region?, country?, timezone? }` |

## 开发

```bash
git clone https://github.com/chengx-coding/forever-saint-liang-websearch.git
cd forever-saint-liang-websearch
npm install
npm run dev
```

## 致谢

本项目受 [websearch-deepseek](https://github.com/lyumeng/websearch-deepseek)（作者 [lyumeng](https://github.com/lyumeng)）启发。两个项目均以 MIT 许可证开源。

## 许可证

MIT
