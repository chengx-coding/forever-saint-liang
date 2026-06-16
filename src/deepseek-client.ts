import type {
  AppConfig,
  DeepSeekApiResponse,
  DeepSeekContentBlock,
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

const MAX_CONTINUATION_TURNS = 5

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

    const messages: (Record<string, unknown> | { role: string; content: DeepSeekContentBlock[] })[] = [
      { role: "system", content: this.config.systemPrompt },
      { role: "user", content: query },
    ]

    const allResults: SearchResult[] = []
    let totalSearchRequests = 0
    let initialRequestBody: Record<string, unknown> = {}

    for (let turn = 0; turn < MAX_CONTINUATION_TURNS; turn++) {
      const body: Record<string, unknown> = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: messages as Record<string, unknown>[],
        tools: [toolDef],
        tool_choice: { type: "auto" },
      }

      if (turn === 0) {
        initialRequestBody = { ...body }
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

      for (const block of data.content) {
        if (block.type === "web_search_tool_result") {
          for (const item of block.content) {
            if (item.type === "web_search_result") {
              allResults.push({
                title: item.title,
                url: item.url,
                content: item.encrypted_content,
                pageAge: item.page_age,
              })
            }
          }
        }
      }

      if (data.usage?.server_tool_use?.web_search_requests) {
        totalSearchRequests += data.usage.server_tool_use.web_search_requests
      }

      if (data.stop_reason !== "pause_turn") {
        break
      }

      messages.push({
        role: "assistant",
        content: data.content,
      })
    }

    return {
      query,
      results: allResults,
      totalSearchRequests,
      requestBody: initialRequestBody,
    }
  }
}
