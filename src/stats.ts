import { existsSync, mkdirSync } from "fs"
import { join } from "path"

function isNodeVersionSufficient(): boolean {
  const major = Number.parseInt(process.versions.node.split(".")[0])
  return major >= 22
}

interface SqliteDatabase {
  exec(sql: string): void
  prepare(sql: string): SqliteStatement
  close(): void
}

interface SqliteStatement {
  run(...params: (string | number | null)[]): void
}

export class SearchStatsRecorder {
  private enabled: boolean
  private configDir: string
  private db: SqliteDatabase | null = null
  private initialized = false

  constructor(enabled: boolean, configDir: string) {
    this.enabled = enabled && isNodeVersionSufficient()
    this.configDir = configDir
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  async init(): Promise<void> {
    if (!this.enabled || this.initialized) return
    try {
      const sqlite = await import("node:sqlite")
      const DatabaseSync = (
        sqlite as { DatabaseSync: new (path: string) => SqliteDatabase }
      ).DatabaseSync

      const dir = this.configDir
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      const dbPath = join(dir, "search-stats.db")
      this.db = new DatabaseSync(dbPath)

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS search_stats (
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          day INTEGER NOT NULL,
          hour INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          PRIMARY KEY (year, month, day, hour)
        )
      `)

      this.initialized = true
    } catch {
      this.enabled = false
    }
  }

  recordSearch(): void {
    if (!this.enabled || !this.initialized || !this.db) return
    try {
      const now = new Date()
      this.db
        .prepare(
          `INSERT INTO search_stats (year, month, day, hour, day_of_week, count)
           VALUES (?, ?, ?, ?, ?, 1)
           ON CONFLICT (year, month, day, hour)
           DO UPDATE SET count = count + 1`,
        )
        .run(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          now.getHours(),
          now.getDay(),
        )
    } catch {
      // silently ignore — must never affect main flow
    }
  }

  close(): void {
    try {
      this.db?.close()
    } catch {
      // silently ignore
    }
    this.db = null
  }
}
