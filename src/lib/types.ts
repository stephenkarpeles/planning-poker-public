import type { PointValue } from "./points";

export type Participant = {
  id: string;
  name: string;
  vote: PointValue | null;
};

export type Session = {
  id: string;
  organizerName: string;
  organizerToken: string;
  organizerParticipantId: string;
  taskName: string;
  revealed: boolean;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
};

export type PublicParticipant = {
  id: string;
  name: string;
  hasVoted: boolean;
  vote: PointValue | null;
};

export type PublicSession = {
  id: string;
  organizerName: string;
  organizerParticipantId: string;
  taskName: string;
  revealed: boolean;
  participants: PublicParticipant[];
  createdAt: string;
  updatedAt: string;
};
