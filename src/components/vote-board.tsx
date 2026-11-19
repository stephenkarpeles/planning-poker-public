"use client";

import { useEffect, useState } from "react";
import { formatMostCommon, mostFrequentVotes } from "@/lib/consensus";
import { POINT_OPTIONS, type PointValue } from "@/lib/points";
import type { PublicSession, TaskHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type VoteBoardProps = {
  session: PublicSession;
  myParticipantId: string | null;
  disabled?: boolean;
  onVote: (value: PointValue) => void;
};

export function VoteBoard({
  session,
  myParticipantId,
  disabled,
  onVote,
}: VoteBoardProps) {
  const me = session.participants.find((p) => p.id === myParticipantId);
  const myVote = me?.vote ?? null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {POINT_OPTIONS.map((value) => {
        const selected = myVote === value;
        return (
          <button
            key={value}
            type="button"
            disabled={disabled || session.revealed}
            onClick={() => onVote(value)}
            className={cn(
              "aspect-[3/4] cursor-pointer rounded-xl border text-2xl font-semibold tracking-tight transition duration-200",
              "border-white/10 bg-white/[0.03] text-zinc-100",
              "hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:-translate-y-0.5",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
              selected &&
                "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]",
            )}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

type ParticipantListProps = {
  session: PublicSession;
  myParticipantId: string | null;
};

export function ParticipantList({
  session,
  myParticipantId,
}: ParticipantListProps) {
  const votes = session.revealed
    ? session.participants
        .map((p) => p.vote)
        .filter((v): v is PointValue => v !== null)
    : [];
  const consensusLabel = formatMostCommon(votes);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-500">
            Players
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {session.participants.filter((p) => p.hasVoted).length}/
            {session.participants.length} voted
          </p>
        </div>
        {session.revealed && consensusLabel !== null && (
          <p className="animate-in fade-in text-sm text-zinc-300">
            Most Common:{" "}
            <span className="font-semibold text-emerald-300">
              {consensusLabel}
            </span>
          </p>
        )}
      </div>

      <ul className="divide-y divide-white/8 rounded-xl border border-white/10 bg-white/[0.02]">
        {session.participants.map((participant) => {
          const isMe = participant.id === myParticipantId;
          const isOrganizer =
            participant.id === session.organizerParticipantId;
          return (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-100">
                  {participant.name}
                  {isMe ? " (you)" : ""}
                </p>
                {isOrganizer && (
                  <p className="text-xs text-zinc-500">Organizer</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {session.revealed ? (
                  <span className="inline-flex h-9 min-w-9 animate-in zoom-in-50 items-center justify-center rounded-lg bg-emerald-400/15 px-2 text-sm font-semibold text-emerald-200 duration-200">
                    {participant.vote ?? "—"}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-2.5 w-2.5 rounded-full transition-colors",
                      participant.hasVoted
                        ? "bg-emerald-400"
                        : "bg-zinc-600",
                    )}
                    title={participant.hasVoted ? "Voted" : "Waiting"}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type OrganizerControlsProps = {
  session: PublicSession;
  busy?: boolean;
  onReveal: () => void;
  onHideVotes: () => void;
  onSubmitFinal: (finalPoints: PointValue) => void;
};

export function OrganizerControls({
  session,
  busy,
  onReveal,
  onHideVotes,
  onSubmitFinal,
}: OrganizerControlsProps) {
  const votes = session.participants
    .map((p) => p.vote)
    .filter((v): v is PointValue => v !== null);
  const modes = mostFrequentVotes(votes);
  const consensusLabel = formatMostCommon(votes);
  const [finalPoints, setFinalPoints] = useState<PointValue | null>(null);

  useEffect(() => {
    if (session.revealed) {
      setFinalPoints(null);
    }
  }, [session.revealed, session.updatedAt]);

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-zinc-200">Organizer controls</p>

      {!session.revealed ? (
        <>
          <Button
            type="button"
            disabled={busy}
            onClick={onReveal}
            className="w-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
          >
            Reveal votes
          </Button>
          <p className="text-xs text-zinc-500">
            Use New task above to clear votes without saving this round.
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onHideVotes}
            className="w-full"
          >
            Hide votes
          </Button>
          <div>
            <p className="text-sm text-zinc-300">
              Pick the final points for{" "}
              <span className="font-medium text-zinc-100">
                {session.taskName || "Untitled task"}
              </span>
            </p>
            {consensusLabel !== null && (
              <p className="mt-2 text-xs text-zinc-500">
                {modes.length > 1 ? "Tie — " : ""}
                Most Common: {consensusLabel}
                {modes.length === 1 ? " (highlighted). " : ". "}
                Click a value to choose, then Submit.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {POINT_OPTIONS.map((value) => {
              const isMode = modes.includes(value);
              const isSelected = finalPoints === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={busy}
                  onClick={() => setFinalPoints(value)}
                  className={cn(
                    "h-11 cursor-pointer rounded-lg border text-base font-semibold transition",
                    "border-white/10 bg-white/[0.03] text-zinc-100",
                    "hover:border-emerald-400/40 hover:bg-emerald-400/10",
                    "disabled:cursor-not-allowed",
                    isMode &&
                      !isSelected &&
                      "border-emerald-400/45 bg-emerald-400/8 text-emerald-200/90 ring-1 ring-emerald-400/25",
                    isSelected &&
                      "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-400/50",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            disabled={busy || finalPoints === null}
            onClick={() => {
              if (finalPoints === null) return;
              onSubmitFinal(finalPoints);
            }}
            className="w-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}

type TaskHistoryProps = {
  history: TaskHistoryEntry[];
};

export function TaskHistory({ history }: TaskHistoryProps) {
  if (!history.length) {
    return (
      <section className="space-y-2 rounded-xl border border-dashed border-white/10 px-4 py-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-500">
          Session history
        </h2>
        <p className="text-sm text-zinc-500">
          Agreed points will show up here as tasks are finalized.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-500">
          Session history
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Agreed points for completed tasks
        </p>
      </div>
      <ul className="divide-y divide-white/8 rounded-xl border border-white/10 bg-white/[0.02]">
        {history.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-100">{entry.name}</p>
              <p className="text-xs text-zinc-500">
                {new Date(entry.decidedAt).toLocaleString()}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Agreed
              </p>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-emerald-400/15 px-2 text-sm font-semibold text-emerald-200">
                {entry.finalPoints}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
