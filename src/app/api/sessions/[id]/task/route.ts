import { NextResponse } from "next/server";
import { renameTask, toPublicSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as {
      organizerToken?: string;
      taskName?: string;
    };
    if (!body.organizerToken) {
      return NextResponse.json(
        { error: "organizerToken is required" },
        { status: 400 },
      );
    }
    const result = await renameTask(id, body.organizerToken, body.taskName);
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
    console.error("rename task failed", error);
    return NextResponse.json(
      { error: "Could not rename task" },
      { status: 500 },
    );
  }
}
