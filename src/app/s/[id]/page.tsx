import { SessionRoom } from "@/components/session-room";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.08),_transparent_50%),linear-gradient(180deg,#09090b,#0c0c0f)]"
      />
      <div className="relative flex-1">
        <SessionRoom sessionId={id} />
      </div>
    </main>
  );
}
