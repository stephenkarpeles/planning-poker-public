const organizerKey = (sessionId: string) => `pp:organizer:${sessionId}`;
const participantKey = (sessionId: string) => `pp:participant:${sessionId}`;
const NAME_KEY = "pp:display-name";

export function saveOrganizerToken(sessionId: string, token: string) {
  localStorage.setItem(organizerKey(sessionId), token);
}

export function loadOrganizerToken(sessionId: string) {
  return localStorage.getItem(organizerKey(sessionId));
}

export function saveParticipantId(sessionId: string, participantId: string) {
  localStorage.setItem(participantKey(sessionId), participantId);
}

export function loadParticipantId(sessionId: string) {
  return localStorage.getItem(participantKey(sessionId));
}

export function saveDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function loadDisplayName() {
  return localStorage.getItem(NAME_KEY) ?? "";
}
