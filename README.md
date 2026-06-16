[English](README.md) | [中文](README.zh-CN.md)

# Forever Saint Liang: Websearch MCP via Deepseek

An MCP server that provides web search capabilities using DeepSeek's Anthropic-compatible API.

Forever indebted to Saint Liang.

## Prerequisites

- Node.js >= 18
- A DeepSeek API key from https://platform.deepseek.com

## Installation

```bash
npm install -g forever-saint-liang-websearch
```

On first run, a user config file is automatically created at `~/.config/.websearch-via-deepseek/settings.json`.

## Quick Start

### 1. Set your API key

Set via environment variable:

```bash
export DEEPSEEK_API_KEY="sk-your-api-key"
```

Or edit `~/.config/.websearch-via-deepseek/settings.json` and set `apiKey`.

### 2. Configure your MCP client

**OpenCode** (`opencode.json`):

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

**Claude Code** (`claude_desktop_config.json` / `.mcp.json`):

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

## Configuration

Configuration is loaded with the following priority (highest first):

1. **CLI arguments** — `--api-key=sk-... --model=deepseek-v4-pro`
2. **Environment variables** — `WEBSEARCH_MODEL`, `WEBSEARCH_ENDPOINT`, etc.
3. **User config file** — `~/.config/.websearch-via-deepseek/settings.json`
4. **Defaults** — built into the server

### Config file (`settings.json`)

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

| Key | Default | Description |
|-----|---------|-------------|
| `apiKey` | (empty) | DeepSeek API key |
| `endpoint` | `https://api.deepseek.com/anthropic/v1/messages` | API endpoint URL |
| `model` | `deepseek-v4-flash` | Model: `deepseek-v4-flash` or `deepseek-v4-pro` |
|| `maxTokens` | `32768` | Max output tokens |
| `systemPrompt` | (see default) | System prompt guiding search behavior |
| `tool.name` | `"web_search"` | Tool name registered in MCP |
| `tool.type` | `"web_search_20260209"` | DeepSeek tool type |
| `tool.max_uses` | `20` | Max search calls per request |

### Environment variables

| Variable | Equivalent config key |
|----------|----------------------|
| `DEEPSEEK_API_KEY` | `apiKey` |
| `WEBSEARCH_API_KEY` | `apiKey` (alternative) |
| `WEBSEARCH_ENDPOINT` | `endpoint` |
| `WEBSEARCH_MODEL` | `model` |
| `WEBSEARCH_MAX_TOKENS` | `maxTokens` |
| `WEBSEARCH_SYSTEM_PROMPT` | `systemPrompt` |
| `WEBSEARCH_TOOL_NAME` | `tool.name` |
| `WEBSEARCH_TOOL_TYPE` | `tool.type` |
| `WEBSEARCH_MAX_USES` | `tool.max_uses` |

### CLI arguments

```bash
forever-saint-liang-websearch --api-key=sk-... --model=deepseek-v4-pro
```

| Argument | Config key |
|----------|-----------|
| `--api-key` | `apiKey` |
| `--endpoint` | `endpoint` |
| `--model` | `model` |
| `--max-tokens` | `maxTokens` |
| `--system-prompt` | `systemPrompt` |
| `--tool-name` | `tool.name` |
| `--tool-type` | `tool.type` |
| `--max-uses` | `tool.max_uses` |

## Tool: `web_search`

Search the web using DeepSeek's built-in web search.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | — | Search query (1-500 chars) |
| `max_uses` | number | No | 5 | Max search calls (capped by server config `tool.max_uses`) |
| `allowed_domains` | string[] | No | — | Only include results from these domains |
| `blocked_domains` | string[] | No | — | Exclude results from these domains |
| `user_location` | object | No | — | Localized results: `{ city?, region?, country?, timezone? }` |

## Development

```bash
git clone https://github.com/chengx-coding/forever-saint-liang-websearch.git
cd forever-saint-liang-websearch
npm install
npm run dev
```

## Acknowledgments

This project is inspired by [websearch-deepseek](https://github.com/lyumeng/websearch-deepseek) by [lyumeng](https://github.com/lyumeng). Both projects are licensed under MIT.

## License

MIT
