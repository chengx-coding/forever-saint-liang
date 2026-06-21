export interface ToolConfig {
  name: string
  type: string
  max_uses?: number
  allowed_domains?: string[]
  blocked_domains?: string[]
  user_location?: {
    city?: string
    region?: string
    country?: string
    timezone?: string
  }
}

export interface AppConfig {
  apiKey: string
  endpoint: string
  model: string
  maxTokens: number
  systemPrompt: string
  tool: ToolConfig
  logEnabled: boolean
  logDir: string
  searchStatsEnabled: boolean
}

export interface DeepSeekWebSearchInput {
  query: string
}

export interface DeepSeekWebSearchToolResult {
  type: "web_search_tool_result"
  tool_use_id: string
  content: WebSearchResultItem[]
}

export interface WebSearchResultItem {
  type: "web_search_result"
  title: string
  url: string
  encrypted_content: string
  page_age: string | null
}

export interface DeepSeekApiResponse {
  id: string
  type: "message"
  role: "assistant"
  model: string
  content: DeepSeekContentBlock[]
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
    server_tool_use?: {
      web_search_requests: number
    }
  }
}

export type DeepSeekContentBlock =
  | { type: "thinking"; thinking: string }
  | { type: "server_tool_use"; id: string; name: string; input: DeepSeekWebSearchInput }
  | DeepSeekWebSearchToolResult
  | { type: "text"; text: string }

export interface SearchResult {
  index: number
  title: string
  url: string
  pageAge: string | null
  toolUseId?: string
  searchQuery?: string
}

export interface SearchUsage {
  inputTokens: number
  outputTokens: number
  webSearchRequests: number
}

export interface SearchResponse {
  query: string
  answer: string
  thinking?: string
  searchQueries: string[]
  results: SearchResult[]
  totalSearchRequests: number
  stopReason: string
  model: string
  turns: number
  usage: SearchUsage
  requestBody: Record<string, unknown>
}
