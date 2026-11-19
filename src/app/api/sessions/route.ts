import { NextResponse } from "next/server";
import {
  CREATE_LIMIT,
  allowRequest,
  clientIp,
  readJsonBody,
} from "@/lib/security";
import { createSession, toPublicSession } from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!allowRequest(`create:${ip}`, CREATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many sessions created. Try again later." },
      { status: 429 },
    );
  }

  const parsed = await readJsonBody<{ organizerName?: string }>(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { session, participantToken } = await createSession(
      parsed.body.organizerName,
    );
    return NextResponse.json({
      organizerToken: session.organizerToken,
      participantId: session.organizerParticipantId,
      participantToken,
      session: toPublicSession(session, participantToken),
    });
  } catch (error) {
    console.error("create session failed", error);
    return NextResponse.json(
      { error: "Could not create session" },
      { status: 500 },
    );
  }
}
