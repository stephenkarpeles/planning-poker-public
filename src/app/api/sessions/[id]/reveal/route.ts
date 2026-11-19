import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/security";
import { revealSession, toPublicSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = await readJsonBody<{ organizerToken?: string }>(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (!parsed.body.organizerToken) {
    return NextResponse.json(
      { error: "organizerToken is required" },
      { status: 400 },
    );
  }
  try {
    const result = await revealSession(id, parsed.body.organizerToken);
    if ("error" in result) {
      const message = result.error ?? "Request failed";
      const status =
        message === "Session not found"
          ? 404
          : message.startsWith("Only the organizer")
            ? 403
            : 400;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({
      session: toPublicSession(result.session),
    });
  } catch (error) {
    console.error("reveal failed", error);
    return NextResponse.json({ error: "Could not reveal votes" }, { status: 500 });
  }
}
