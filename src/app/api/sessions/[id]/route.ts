import { NextResponse } from "next/server";
import { loadSession, toPublicSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Only a secret participant token may unlock that person's unrevealed vote.
  const viewerToken = new URL(request.url).searchParams.get("token");
  return NextResponse.json({
    session: toPublicSession(session, viewerToken),
  });
}
