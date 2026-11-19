import { nanoid } from "nanoid";
import { isPointValue, type PointValue } from "./points";
import { getSession, saveSession } from "./store";
import type { PublicSession, Session } from "./types";

const MAX_NAME = 40;
const MAX_TASK = 120;
const MAX_PARTICIPANTS = 40;

export function sanitizeName(raw: unknown, fallback = "Guest") {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
  return trimmed || fallback;
}

export function sanitizeTask(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TASK);
}

export function toPublicSession(
  session: Session,
  viewerParticipantId?: string | null,
): PublicSession {
  return {
    id: session.id,
    organizerName: session.organizerName,
    organizerParticipantId: session.organizerParticipantId,
    taskName: session.taskName,
    revealed: session.revealed,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    participants: session.participants.map((participant) => {
      const isSelf = participant.id === viewerParticipantId;
      const showVote = session.revealed || isSelf;
      return {
        id: participant.id,
        name: participant.name,
        hasVoted: participant.vote !== null,
        vote: showVote ? participant.vote : null,
      };
    }),
  };
}

export async function createSession(organizerNameRaw: unknown) {
  const organizerName = sanitizeName(organizerNameRaw, "Organizer");
  const now = new Date().toISOString();
  const organizerParticipantId = nanoid(10);
  const session: Session = {
    id: nanoid(10),
    organizerName,
    organizerToken: nanoid(24),
    organizerParticipantId,
    taskName: "",
    revealed: false,
    participants: [
      {
        id: organizerParticipantId,
        name: organizerName,
        vote: null,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await saveSession(session);
  return session;
}

export async function joinSession(sessionId: string, nameRaw: unknown) {
  const session = await getSession(sessionId);
  if (!session) return { error: "Session not found" as const };

  if (session.participants.length >= MAX_PARTICIPANTS) {
    return { error: "Session is full" as const };
  }

  const name = sanitizeName(nameRaw);
  const participant = {
    id: nanoid(10),
    name,
    vote: null as PointValue | null,
  };
  session.participants.push(participant);
  await saveSession(session);
  return { session, participantId: participant.id };
}

export async function castVote(
  sessionId: string,
  participantId: string,
  voteRaw: unknown,
) {
  if (!isPointValue(voteRaw)) {
    return { error: "Invalid point value" as const };
  }
  const session = await getSession(sessionId);
  if (!session) return { error: "Session not found" as const };
  if (session.revealed) {
    return { error: "Votes are locked until the next task" as const };
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) return { error: "Participant not found" as const };

  participant.vote = voteRaw;
  await saveSession(session);
  return { session };
}

export async function revealSession(sessionId: string, organizerToken: string) {
  const session = await getSession(sessionId);
  if (!session) return { error: "Session not found" as const };
  if (session.organizerToken !== organizerToken) {
    return { error: "Only the organizer can reveal" as const };
  }
  session.revealed = true;
  await saveSession(session);
  return { session };
}

export async function startNewTask(
  sessionId: string,
  organizerToken: string,
  taskNameRaw: unknown,
) {
  const session = await getSession(sessionId);
  if (!session) return { error: "Session not found" as const };
  if (session.organizerToken !== organizerToken) {
    return { error: "Only the organizer can start a new task" as const };
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

export async function loadSession(sessionId: string) {
  return getSession(sessionId);
}
