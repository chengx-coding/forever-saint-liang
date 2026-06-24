import { Command } from "commander"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import { loadConfig } from "./config.js"
import { DeepSeekClient } from "./deepseek-client.js"
import { SearchStatsRecorder } from "./stats.js"
import type { SearchResponse } from "./types.js"
import type { StatsQueryResult } from "./stats.js"

function getVersion(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  return (
    JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
    ) as { version: string }
  ).version
}

export function createCli() {
  const version = getVersion()

  const program = new Command()
  program
    .name("forever-saint-liang-websearch")
    .version(version)
    .description(
      "Web search via DeepSeek — MCP server with CLI mode",
    )
    .allowUnknownOption()
    .passThroughOptions()

  program
    .command("search <query>")
    .description("Perform a web search")
    .action(async (query: string, _opts: unknown, cmd: Command) => {
      const parent = cmd.parent!
      const argv = parent.args as string[]

      const { config } = loadConfig(argv)
      if (!config.apiKey) {
        console.error(
          "API key required. Set DEEPSEEK_API_KEY env var or use --api-key=sk-...",
        )
        process.exit(1)
      }

      const client = new DeepSeekClient(config)
      try {
        const response: SearchResponse = await client.search({ query })
        const output = {
          query: response.query,
          totalSearchRequests: response.totalSearchRequests,
          results: response.results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            pageAge: r.pageAge,
          })),
        }
        console.log(JSON.stringify(output, null, 2))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Search failed: ${msg}`)
        process.exit(1)
      }
    })

  program
    .command("stats [from] [to]")
    .description("Show search statistics")
    .action(async (from?: string, to?: string) => {
      const configResult = loadConfig()

      const stats = new SearchStatsRecorder(
        configResult.config.searchStatsEnabled,
        configResult.configDir,
      )
      await stats.init()

      const now = new Date()
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      )
      const fromDate = from ? new Date(from) : todayStart
      const toDate = to ? new Date(to) : now

      try {
        const result: StatsQueryResult = stats.queryStats(fromDate, toDate)

        if (!result.available) {
          console.error(result.unavailableReason ?? "Stats unavailable")
          process.exit(1)
        }

        console.log(
          JSON.stringify(
            {
              totalCount: result.totalCount,
              hours: result.records.length,
              range: `${fromDate.toISOString()} — ${toDate.toISOString()}`,
              records: result.records,
            },
            null,
            2,
          ),
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Stats query failed: ${msg}`)
        process.exit(1)
      } finally {
        stats.close()
      }
    })

  program.command("version").description("Show version number").action(() => {
    console.log(version)
  })

  program.command("help").description("Show help information").action(() => {
    program.outputHelp()
  })

  return program
}

export function runCli(argv: string[]): void {
  createCli().parse(argv)
}
