import { tmpdir } from "os"
import { join } from "path"
import { appendFileSync, existsSync, mkdirSync } from "fs"
import { randomBytes } from "crypto"

import type { SearchResponse } from "./types.js"

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0")
}

function generateFileName(): string {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") +
    "T" +
    [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("-") +
    "-" + pad(now.getMilliseconds(), 3)

  const hash = randomBytes(4).toString("hex")

  return `${datePart}_${hash}.jsonl`
}

export class SearchLogger {
  private enabled: boolean
  private logDir: string

  constructor(enabled: boolean, logDir: string) {
    this.enabled = enabled
    this.logDir = logDir
  }

  log(response: SearchResponse): void {
    if (!this.enabled) return

    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      const fileName = generateFileName()
      const filePath = join(this.logDir, fileName)

      const searchEntry = {
        type: "search",
        timestamp: new Date().toISOString(),
        query: response.query,
        model: response.model,
        stopReason: response.stopReason,
        turns: response.turns,
        searchQueries: response.searchQueries,
        totalSearchRequests: response.totalSearchRequests,
        usage: response.usage,
        answer: response.answer,
        thinking: response.thinking ?? null,
        requestBody: response.requestBody,
      }
      appendFileSync(filePath, JSON.stringify(searchEntry) + "\n", "utf-8")

      for (let i = 0; i < response.results.length; i++) {
        const r = response.results[i]
        const resultEntry = {
          type: "result",
          index: r.index ?? i,
          title: r.title,
          url: r.url,
          pageAge: r.pageAge,
          searchQuery: r.searchQuery ?? null,
          toolUseId: r.toolUseId ?? null,
        }
        appendFileSync(filePath, JSON.stringify(resultEntry) + "\n", "utf-8")
      }
    } catch {
    }
  }

  static defaultLogDir(): string {
    return join(tmpdir(), "websearch-via-deepseek-logs")
  }
}
