const organizerKey = (sessionId: string) => `pp:organizer:${sessionId}`;
const participantIdKey = (sessionId: string) => `pp:participant:${sessionId}`;
const participantTokenKey = (sessionId: string) =>
  `pp:participant-token:${sessionId}`;
const NAME_KEY = "pp:display-name";

export function saveOrganizerToken(sessionId: string, token: string) {
  localStorage.setItem(organizerKey(sessionId), token);
}

export function loadOrganizerToken(sessionId: string) {
  return localStorage.getItem(organizerKey(sessionId));
}

export function saveParticipantId(sessionId: string, participantId: string) {
  localStorage.setItem(participantIdKey(sessionId), participantId);
}

export function loadParticipantId(sessionId: string) {
  return localStorage.getItem(participantIdKey(sessionId));
}

export function saveParticipantToken(sessionId: string, token: string) {
  localStorage.setItem(participantTokenKey(sessionId), token);
}

export function loadParticipantToken(sessionId: string) {
  return localStorage.getItem(participantTokenKey(sessionId));
}

export function saveDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function loadDisplayName() {
  return localStorage.getItem(NAME_KEY) ?? "";
}
