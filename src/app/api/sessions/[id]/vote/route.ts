import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/security";
import { castVote, toPublicSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = await readJsonBody<{
    participantToken?: string;
    vote?: number;
  }>(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.body.participantToken) {
    return NextResponse.json(
      { error: "participantToken is required" },
      { status: 401 },
    );
  }

  try {
    const result = await castVote(
      id,
      parsed.body.participantToken,
      parsed.body.vote,
    );
    if ("error" in result) {
      const status =
        result.error === "Session not found"
          ? 404
          : result.error === "Unauthorized"
            ? 401
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      session: toPublicSession(result.session, parsed.body.participantToken),
    });
  } catch (error) {
    console.error("vote failed", error);
    return NextResponse.json({ error: "Could not cast vote" }, { status: 500 });
  }
}
