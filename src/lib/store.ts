import { neon } from "@neondatabase/serverless";
import { SESSION_TTL_MS } from "./security";
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

function isExpired(session: Session) {
  const updated = Date.parse(session.updatedAt || session.createdAt);
  if (!Number.isFinite(updated)) return true;
  return Date.now() - updated > SESSION_TTL_MS;
}

export async function deleteSession(id: string): Promise<void> {
  const sql = sqlClient();
  if (!sql) {
    memoryMap().delete(id);
    return;
  }
  await ensureSchema();
  await sql`DELETE FROM planning_poker_sessions WHERE id = ${id}`;
}

export async function getSession(id: string): Promise<Session | null> {
  const sql = sqlClient();
  let session: Session | null = null;

  if (!sql) {
    session = memoryMap().get(id) ?? null;
  } else {
    await ensureSchema();
    const rows = await sql`
      SELECT data FROM planning_poker_sessions WHERE id = ${id} LIMIT 1
    `;
    session = rows[0] ? (rows[0].data as Session) : null;
  }

  if (!session) return null;
  if (isExpired(session)) {
    await deleteSession(id);
    return null;
  }
  return session;
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

/** Best-effort cleanup of stale rows (called occasionally on create). */
export async function pruneExpiredSessions(): Promise<void> {
  const cutoff = new Date(Date.now() - SESSION_TTL_MS).toISOString();
  const sql = sqlClient();
  if (!sql) {
    const map = memoryMap();
    for (const [id, session] of map) {
      if (isExpired(session)) map.delete(id);
    }
    return;
  }
  await ensureSchema();
  await sql`
    DELETE FROM planning_poker_sessions
    WHERE updated_at < ${cutoff}::timestamptz
  `;
}

export function usingDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
