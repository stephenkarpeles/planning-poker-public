import { NextResponse } from "next/server";
import {
  JOIN_LIMIT,
  allowRequest,
  clientIp,
  readJsonBody,
} from "@/lib/security";
import { joinSession, toPublicSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const ip = clientIp(request);
  if (!allowRequest(`join:${ip}:${id}`, JOIN_LIMIT)) {
    return NextResponse.json(
      { error: "Too many join attempts. Try again later." },
      { status: 429 },
    );
  }

  const parsed = await readJsonBody<{ name?: string }>(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await joinSession(id, parsed.body.name);
    if ("error" in result) {
      const status = result.error === "Session not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      participantId: result.participantId,
      participantToken: result.participantToken,
      session: toPublicSession(result.session, result.participantToken),
    });
  } catch (error) {
    console.error("join session failed", error);
    return NextResponse.json({ error: "Could not join session" }, { status: 500 });
  }
}
