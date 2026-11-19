import { neon } from "@neondatabase/serverless";
import type { Session } from "./types";

const globalStore = globalThis as typeof globalThis & {
  __planningPokerSessions?: Map<string, Session>;
};

function memoryMap() {
  if (!globalStore.__planningPokerSessions) {
    globalStore.__planningPokerSessions = new Map();
  }
  return globalStore.__planningPokerSessions;
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL && process.env.NODE_ENV === "production") {
      console.warn(
        "DATABASE_URL is not set. Sessions use in-memory storage and will not sync across Vercel instances. Add Neon/Postgres.",
      );
    }
    return null;
  }
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  const sql = sqlClient();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS planning_poker_sessions (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function getSession(id: string): Promise<Session | null> {
  const sql = sqlClient();
  if (!sql) {
    return memoryMap().get(id) ?? null;
  }

  await ensureSchema();
  const rows = await sql`
    SELECT data FROM planning_poker_sessions WHERE id = ${id} LIMIT 1
  `;
  if (!rows[0]) return null;
  return rows[0].data as Session;
}

export async function saveSession(session: Session): Promise<void> {
  const next = { ...session, updatedAt: new Date().toISOString() };
  const sql = sqlClient();
  if (!sql) {
    memoryMap().set(next.id, next);
    return;
  }

  await ensureSchema();
  const payload = JSON.stringify(next);
  await sql`
    INSERT INTO planning_poker_sessions (id, data, updated_at)
    VALUES (${next.id}, ${payload}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

export function usingDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
