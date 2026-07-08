import { existsSync, readFileSync } from 'fs'
import path from 'path'
import postgres from 'postgres'

function loadEnvFile() {
  const candidates = ['.env.local', '.env', '.env.development.local', '.env.development']

  for (const file of candidates) {
    const fullPath = path.resolve(process.cwd(), file)
    if (!existsSync(fullPath)) continue

    for (const line of readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      const rawValue = trimmed.slice(separatorIndex + 1).trim()

      if (!key || process.env[key] !== undefined) continue

      process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
    }
  }
}

loadEnvFile()

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.SUPABASE_DB_URL

const isRemoteConnection = Boolean(connectionString) && /(?:neon\.tech|supabase\.(?:com|co)|render\.com|railway\.app|fly\.dev|aws\.amazonaws\.com)/i.test(connectionString)

let sqlInstance: ReturnType<typeof postgres> | ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>)

if (connectionString) {
  sqlInstance = postgres(connectionString, {
    ssl: isRemoteConnection ? { rejectUnauthorized: false } : false,
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  })
} else {
  try {
    const { getDatabase } = await import('@netlify/database')
    const database = getDatabase()
    sqlInstance = database.sql.bind(database)
  } catch {
    sqlInstance = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      throw new Error(
        'Database belum dikonfigurasi. Set DATABASE_URL (disarankan) atau POSTGRES_URL / NEON_DATABASE_URL / SUPABASE_DB_URL.'
      )
    }) as unknown as ReturnType<typeof postgres>
  }
}

export const sql = sqlInstance

export interface Tracking {
  id: string
  nomor_target: string
  ip: string | null
  user_agent: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  province: string | null
  country: string | null
  status_link: 'active' | 'opened' | 'expired'
  status_lokasi: 'pending' | 'gagal' | 'Lokasi Didapatkan'
  password_hash: string | null
  password_plain: string | null
  created_at: string
  expired_at: string
}
