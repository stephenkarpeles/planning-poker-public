import { NextResponse } from "next/server";
import { joinSession, toPublicSession } from "@/lib/session";


type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { name?: string };
    const result = await joinSession(id, body.name);
    if ("error" in result) {
      const status = result.error === "Session not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      participantId: result.participantId,
      session: toPublicSession(result.session, result.participantId),
    });
  } catch (error) {
    console.error("join session failed", error);
    return NextResponse.json({ error: "Could not join session" }, { status: 500 });
  }
}
