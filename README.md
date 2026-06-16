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

## Configuration

Set the `DEEPSEEK_API_KEY` environment variable:

```bash
export DEEPSEEK_API_KEY="sk-your-api-key"
```

Optional: Set `DEEPSEEK_MODEL` to change the model (default: `deepseek-v4-flash`):

```bash
export DEEPSEEK_MODEL="deepseek-v4-pro"
```

## MCP Client Configuration

Add to your MCP client config:

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

## Tool: `web_search`

Search the web using DeepSeek's built-in web search.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | — | Search query (1-500 chars) |
| `max_uses` | number | No | 5 | Max search calls (1-20), each returns ~10 results |
| `time_range` | enum | No | — | Filter: `OneDay`, `OneWeek`, `OneMonth`, `OneYear` |
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
