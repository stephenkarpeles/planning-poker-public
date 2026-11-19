import { nanoid } from "nanoid";
import { isPointValue, type PointValue } from "./points";
import { safeEqual } from "./security";
import { getSession, pruneExpiredSessions, saveSession } from "./store";
import type { Participant, PublicSession, Session } from "./types";

const MAX_NAME = 40;
const MAX_TASK = 120;
const MAX_PARTICIPANTS = 40;
const MAX_HISTORY = 100;

export function sanitizeName(raw: unknown, fallback = "Guest") {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
  return trimmed || fallback;
}

export function sanitizeTask(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TASK);
}

function findByToken(session: Session, token: string | null | undefined) {
  if (!token) return null;
  return (
    session.participants.find(
      (participant) =>
        typeof participant.token === "string" &&
        safeEqual(participant.token, token),
    ) ?? null
  );
}

function withDefaults(session: Session): Session {
  return {
    ...session,
    history: Array.isArray(session.history) ? session.history : [],
  };
}

export function toPublicSession(
  session: Session,
  viewerToken?: string | null,
): PublicSession {
  const normalized = withDefaults(session);
  const viewer = findByToken(normalized, viewerToken);
  return {
    id: normalized.id,
    organizerName: normalized.organizerName,
    organizerParticipantId: normalized.organizerParticipantId,
    taskName: normalized.taskName,
    revealed: normalized.revealed,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    history: normalized.history,
    participants: normalized.participants.map((participant) => {
      const isSelf = Boolean(viewer && viewer.id === participant.id);
      const showVote = normalized.revealed || isSelf;
      return {
        id: participant.id,
        name: participant.name,
        hasVoted: participant.vote !== null,
        vote: showVote ? participant.vote : null,
      };
    }),
  };
}

function newParticipant(name: string): Participant {
  return {
    id: nanoid(10),
    token: nanoid(24),
    name,
    vote: null,
  };
}

export async function createSession(organizerNameRaw: unknown) {
  if (Math.random() < 0.2) {
    void pruneExpiredSessions().catch(() => undefined);
  }

  const organizerName = sanitizeName(organizerNameRaw, "Organizer");
  const now = new Date().toISOString();
  const organizer = newParticipant(organizerName);
  const session: Session = {
    id: nanoid(10),
    organizerName,
    organizerToken: nanoid(24),
    organizerParticipantId: organizer.id,
    taskName: "",
    revealed: false,
    participants: [organizer],
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveSession(session);
  return { session, participantToken: organizer.token };
}

export async function joinSession(sessionId: string, nameRaw: unknown) {
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);

  if (session.participants.length >= MAX_PARTICIPANTS) {
    return { error: "Session is full" as const };
  }

  const participant = newParticipant(sanitizeName(nameRaw));
  session.participants.push(participant);
  await saveSession(session);
  return {
    session,
    participantId: participant.id,
    participantToken: participant.token,
  };
}

export async function castVote(
  sessionId: string,
  participantToken: string,
  voteRaw: unknown,
) {
  if (!isPointValue(voteRaw)) {
    return { error: "Invalid point value" as const };
  }
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);
  if (session.revealed) {
    return { error: "Votes are locked until the next task" as const };
  }

  const participant = findByToken(session, participantToken);
  if (!participant) return { error: "Unauthorized" as const };

  participant.vote = voteRaw;
  await saveSession(session);
  return { session, participantToken };
}

export async function revealSession(sessionId: string, organizerToken: string) {
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);
  if (!safeEqual(session.organizerToken, organizerToken)) {
    return { error: "Only the organizer can reveal" as const };
  }
  session.revealed = true;
  await saveSession(session);
  return { session };
}

/**
 * Save the current revealed round into history with a final point value,
 * then clear votes and optionally start the next task name.
 */
export async function finalizeAndStartNext(
  sessionId: string,
  organizerToken: string,
  finalPointsRaw: unknown,
  nextTaskNameRaw: unknown,
) {
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);
  if (!safeEqual(session.organizerToken, organizerToken)) {
    return { error: "Only the organizer can finalize" as const };
  }
  if (!session.revealed) {
    return { error: "Reveal votes before saving the final points" as const };
  }
  if (!isPointValue(finalPointsRaw)) {
    return { error: "Pick a final point value" as const };
  }

  session.history = [
    {
      id: nanoid(10),
      name: session.taskName.trim() || "Untitled task",
      finalPoints: finalPointsRaw,
      votes: session.participants.map((participant) => ({
        name: participant.name,
        vote: participant.vote,
      })),
      decidedAt: new Date().toISOString(),
    },
    ...session.history,
  ].slice(0, MAX_HISTORY);

  session.taskName = sanitizeTask(nextTaskNameRaw);
  session.revealed = false;
  session.participants = session.participants.map((participant) => ({
    ...participant,
    vote: null,
  }));
  await saveSession(session);
  return { session };
}

/** Abandon the current unrevealed round and start a fresh task (nothing saved). */
export async function startNewTask(
  sessionId: string,
  organizerToken: string,
  taskNameRaw: unknown,
) {
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);
  if (!safeEqual(session.organizerToken, organizerToken)) {
    return { error: "Only the organizer can start a new task" as const };
  }
  if (session.revealed) {
    return {
      error: "Pick final points to save this task before starting the next one",
    } as const;
  }

  session.taskName = sanitizeTask(taskNameRaw);
  session.revealed = false;
  session.participants = session.participants.map((participant) => ({
    ...participant,
    vote: null,
  }));
  await saveSession(session);
  return { session };
}

export async function renameTask(
  sessionId: string,
  organizerToken: string,
  taskNameRaw: unknown,
) {
  const raw = await getSession(sessionId);
  if (!raw) return { error: "Session not found" as const };
  const session = withDefaults(raw);
  if (!safeEqual(session.organizerToken, organizerToken)) {
    return { error: "Only the organizer can rename the task" as const };
  }

  session.taskName = sanitizeTask(taskNameRaw);
  await saveSession(session);
  return { session };
}

export async function loadSession(sessionId: string) {
  const session = await getSession(sessionId);
  return session ? withDefaults(session) : null;
}

export function viewerIdFromToken(
  session: Session,
  participantToken?: string | null,
) {
  return findByToken(withDefaults(session), participantToken)?.id ?? null;
}
