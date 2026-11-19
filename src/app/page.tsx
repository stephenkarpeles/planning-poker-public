import { CreateSessionForm } from "@/components/create-session-form";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(24,24,27,0.9),_#09090b)]"
      />
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-4 py-16">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-400/90">
            Planning Poker
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Point stories together, then reveal.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-zinc-400">
            Start a session, share the link with your team, vote{" "}
            <span className="text-zinc-200">1 · 2 · 3 · 5 · 8 · 13</span>, and
            flip the cards when everyone is ready.
          </p>
        </div>
        <CreateSessionForm />
      </div>
    </main>
  );
}
