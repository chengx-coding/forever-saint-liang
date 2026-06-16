import type {
  AppConfig,
  DeepSeekApiResponse,
  SearchResponse,
  SearchResult,
} from "./types.js"

export interface SearchOptions {
  query: string
  maxUses?: number
  allowedDomains?: string[]
  blockedDomains?: string[]
  userLocation?: {
    city?: string
    region?: string
    country?: string
    timezone?: string
  }
}

export class DeepSeekClient {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const {
      query,
      maxUses,
      allowedDomains,
      blockedDomains,
      userLocation,
    } = options

    const toolConfig = this.config.tool

    const toolDef: Record<string, unknown> = {
      type: toolConfig.type,
      name: toolConfig.name,
    }

    const effectiveMaxUses = maxUses ?? toolConfig.max_uses
    if (effectiveMaxUses !== undefined) {
      toolDef.max_uses = Math.min(Math.max(effectiveMaxUses, 1), 20)
    }

    if (allowedDomains?.length) {
      toolDef.allowed_domains = allowedDomains
    }
    if (blockedDomains?.length) {
      toolDef.blocked_domains = blockedDomains
    }
    if (userLocation) {
      toolDef.user_location = {
        type: "approximate",
        ...userLocation,
      }
    }

    const messages: Record<string, string>[] = [
      { role: "user", content: query },
    ]

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages,
      tools: [toolDef],
      tool_choice: { type: "auto" },
    }

    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText}`,
      )
    }

    const data = (await response.json()) as DeepSeekApiResponse

    const result = this.parseResponse(query, data)
    result.requestBody = body
    return result
  }

  private parseResponse(
    query: string,
    data: DeepSeekApiResponse,
  ): SearchResponse {
    const results: SearchResult[] = []
    let totalSearchRequests = 0

    if (data.usage?.server_tool_use?.web_search_requests) {
      totalSearchRequests = data.usage.server_tool_use.web_search_requests
    }

    for (const block of data.content) {
      if (block.type === "web_search_tool_result") {
        for (const item of block.content) {
          if (item.type === "web_search_result") {
            results.push({
              title: item.title,
              url: item.url,
              content: item.encrypted_content,
              pageAge: item.page_age,
            })
          }
        }
      }
    }

    return { query, results, totalSearchRequests, requestBody: {} }
  }
}
