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
    const searchQueries: string[] = []
    const answerParts: string[] = []
    const thinkingParts: string[] = []
    let totalSearchRequests = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let initialRequestBody: Record<string, unknown> = {}
    let lastStopReason = ""
    let lastModel = this.config.model
    let turnsExecuted = 0
    let resultIndex = 0
    let hasRetriedOnEmpty = false

    const toolUseIdToQuery = new Map<string, string>()

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
      turnsExecuted = turn + 1
      lastStopReason = data.stop_reason
      if (data.model) lastModel = data.model

      for (const block of data.content) {
        if (block.type === "server_tool_use") {
          if (block.input?.query) {
            searchQueries.push(block.input.query)
            if (block.id) {
              toolUseIdToQuery.set(block.id, block.input.query)
            }
          }
        } else if (block.type === "web_search_tool_result") {
          const sourceQuery = toolUseIdToQuery.get(block.tool_use_id)
          for (const item of block.content) {
            if (item.type === "web_search_result") {
              allResults.push({
                index: resultIndex++,
                title: item.title,
                url: item.url,
                pageAge: item.page_age,
                toolUseId: block.tool_use_id,
                searchQuery: sourceQuery,
              })
            }
          }
        } else if (block.type === "text") {
          if (block.text) answerParts.push(block.text)
        } else if (block.type === "thinking") {
          if (block.thinking) thinkingParts.push(block.thinking)
        }
      }

      if (data.usage) {
        totalInputTokens += data.usage.input_tokens ?? 0
        totalOutputTokens += data.usage.output_tokens ?? 0
        if (data.usage.server_tool_use?.web_search_requests) {
          totalSearchRequests += data.usage.server_tool_use.web_search_requests
        }
      }

      if (data.stop_reason !== "pause_turn") {
        if (
          data.stop_reason === "end_turn" &&
          allResults.length === 0 &&
          !hasRetriedOnEmpty
        ) {
          hasRetriedOnEmpty = true
          messages.push({
            role: "assistant",
            content: data.content,
          })
          continue
        }
        break
      }

      messages.push({
        role: "assistant",
        content: data.content,
      })
    }

    return {
      query,
      answer: answerParts.join("\n\n"),
      thinking: thinkingParts.length > 0 ? thinkingParts.join("\n\n") : undefined,
      searchQueries,
      results: allResults,
      totalSearchRequests,
      stopReason: lastStopReason,
      model: lastModel,
      turns: turnsExecuted,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        webSearchRequests: totalSearchRequests,
      },
      requestBody: initialRequestBody,
    }
  }
}
