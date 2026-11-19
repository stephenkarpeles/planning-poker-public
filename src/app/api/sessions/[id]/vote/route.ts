import { NextResponse } from "next/server";
import { castVote, toPublicSession } from "@/lib/session";


type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as {
      participantId?: string;
      vote?: number;
    };
    if (!body.participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 },
      );
    }
    const result = await castVote(id, body.participantId, body.vote);
    if ("error" in result) {
      const status = result.error === "Session not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      session: toPublicSession(result.session, body.participantId),
    });
  } catch (error) {
    console.error("vote failed", error);
    return NextResponse.json({ error: "Could not cast vote" }, { status: 500 });
  }
}
