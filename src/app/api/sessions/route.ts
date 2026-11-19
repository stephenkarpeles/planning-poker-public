import { NextResponse } from "next/server";
import { createSession, toPublicSession } from "@/lib/session";


export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { organizerName?: string };
    const session = await createSession(body.organizerName);
    return NextResponse.json({
      organizerToken: session.organizerToken,
      participantId: session.organizerParticipantId,
      session: toPublicSession(session, session.organizerParticipantId),
    });
  } catch (error) {
    console.error("create session failed", error);
    return NextResponse.json(
      { error: "Could not create session" },
      { status: 500 },
    );
  }
}
