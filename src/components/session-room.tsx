"use client";

import { Check, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OrganizerControls,
  ParticipantList,
  TaskHistory,
  VoteBoard,
} from "@/components/vote-board";
import {
  loadDisplayName,
  loadOrganizerToken,
  loadParticipantId,
  loadParticipantToken,
  saveDisplayName,
  saveParticipantId,
  saveParticipantToken,
} from "@/lib/client-storage";
import type { PointValue } from "@/lib/points";
import type { PublicSession } from "@/lib/types";

type SessionRoomProps = {
  sessionId: string;
};

export function SessionRoom({ sessionId }: SessionRoomProps) {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [organizerToken, setOrganizerToken] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isOrganizer = Boolean(organizerToken);
  const refresh = useCallback(
    async (viewerToken?: string | null) => {
      const token = viewerToken ?? participantToken;
      const query = token ? `?token=${encodeURIComponent(token)}` : "";
      const response = await fetch(`/api/sessions/${sessionId}${query}`, {
        cache: "no-store",
      });
      if (response.status === 404) {
        setNotFound(true);
        setSession(null);
        return null;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load session");
      }
      setSession((prev) => {
        const next = data.session as PublicSession;
        setEditingTitle((isEditing) => {
          if (!isEditing && prev?.taskName !== next.taskName) {
            setTaskDraft(next.taskName ?? "");
          }
          return isEditing;
        });
        if (!prev) {
          setTaskDraft(next.taskName ?? "");
        }
        return next;
      });
      setNotFound(false);
      return data.session as PublicSession;
    },
    [participantToken, sessionId],
  );

  useEffect(() => {
    setShareUrl(`${window.location.origin}/s/${sessionId}`);
    setJoinName(loadDisplayName());
    const savedParticipant = loadParticipantId(sessionId);
    const savedToken = loadParticipantToken(sessionId);
    const savedOrganizer = loadOrganizerToken(sessionId);
    setParticipantId(savedParticipant);
    setParticipantToken(savedToken);
    setOrganizerToken(savedOrganizer);

    let cancelled = false;
    (async () => {
      try {
        await refresh(savedToken);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh(participantToken).catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [participantToken, refresh]);

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not join");
      }
      saveDisplayName(joinName.trim());
      saveParticipantId(sessionId, data.participantId);
      saveParticipantToken(sessionId, data.participantToken);
      setParticipantId(data.participantId);
      setParticipantToken(data.participantToken);
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  async function handleVote(vote: PointValue) {
    if (!participantToken) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantToken, vote }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not vote");
      }
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not vote");
    } finally {
      setBusy(false);
    }
  }

  async function handleReveal() {
    if (!organizerToken) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not reveal");
      }
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reveal");
    } finally {
      setBusy(false);
    }
  }

  async function handleHideVotes() {
    if (!organizerToken) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not hide votes");
      }
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not hide votes");
    } finally {
      setBusy(false);
    }
  }

  async function handleSkipRound() {
    if (!organizerToken) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerToken, taskName: "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not start new task");
      }
      setSession(data.session);
      setTaskDraft("");
      setEditingTitle(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start new task");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitFinal(finalPoints: PointValue) {
    if (!organizerToken) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerToken,
          finalPoints,
          nextTaskName: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not submit points");
      }
      setSession(data.session);
      setTaskDraft("");
      setEditingTitle(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit points");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  function startEditingTitle() {
    setTaskDraft(session?.taskName ?? "");
    setEditingTitle(true);
  }

  function cancelEditingTitle() {
    setTaskDraft(session?.taskName ?? "");
    setEditingTitle(false);
  }

  async function saveTaskTitle() {
    if (!organizerToken || !session) return;
    const next = taskDraft.trim();
    const current = session.taskName.trim();
    if (next === current) {
      setEditingTitle(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerToken, taskName: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not rename task");
      }
      setSession(data.session);
      setTaskDraft(data.session.taskName ?? "");
      setEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename task");
      setTaskDraft(session.taskName);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy link");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center text-zinc-400">
        Loading session…
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Session not found
        </h1>
        <p className="mt-2 text-zinc-400">
          Ask the organizer for a fresh link.
        </p>
        <Button asChild className="mt-6" variant="secondary">
          <a href="/">Start a new session</a>
        </Button>
      </div>
    );
  }

  if (!participantToken) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16">
        <div className="max-w-md">
          <p className="text-sm uppercase tracking-[0.16em] text-emerald-400/80">
            Planning Poker
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
            Join {session.organizerName}&apos;s session
          </h1>
          <p className="mt-2 text-zinc-400">
            Enter your name to start voting on{" "}
            <span className="text-zinc-200">
              {session.taskName || "the current task"}
            </span>
            .
          </p>
        </div>
        <form onSubmit={handleJoin} className="max-w-md space-y-5">
          <div className="space-y-2">
            <Label htmlFor="join-name" className="text-zinc-300">
              Your name
            </Label>
            <Input
              id="join-name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Jordan"
              required
              maxLength={40}
              className="h-12 border-white/10 bg-white/[0.04] text-base"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={busy || !joinName.trim()}
            className="h-12 w-full bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300"
          >
            {busy ? "Joining…" : "Join session"}
          </Button>
        </form>
        <TaskHistory history={session.history ?? []} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-emerald-400/80">
              Planning Poker
            </p>
            {isOrganizer ? (
              <div className="mt-2 w-full max-w-xl">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={titleInputRef}
                      id="task-name"
                      value={taskDraft}
                      onChange={(e) => setTaskDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveTaskTitle();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEditingTitle();
                        }
                      }}
                      placeholder="Untitled task"
                      maxLength={120}
                      aria-label="Task name"
                      className="h-12 flex-1 border-white/15 bg-white/[0.04] px-3 text-3xl font-semibold tracking-tight text-zinc-50 placeholder:font-semibold placeholder:text-zinc-500 md:text-3xl"
                    />
                    <Button
                      type="button"
                      size="icon-lg"
                      disabled={busy}
                      onClick={() => void saveTaskTitle()}
                      aria-label="Save task name"
                      className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                    >
                      <Check />
                    </Button>
                    <Button
                      type="button"
                      size="icon-lg"
                      variant="secondary"
                      disabled={busy}
                      onClick={cancelEditingTitle}
                      aria-label="Cancel editing"
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <h1 className="min-w-0 flex-1 text-3xl font-semibold tracking-tight text-zinc-50">
                      {session.taskName || "Untitled task"}
                    </h1>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={startEditingTitle}
                      aria-label="Edit task name"
                      className="mt-1 shrink-0 text-zinc-400 hover:text-zinc-100"
                    >
                      <Pencil />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
                {session.taskName || "Untitled task"}
              </h1>
            )}
            <p className="mt-1 text-sm text-zinc-400">
              Hosted by {session.organizerName}
            </p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              session.revealed
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-white/5 text-zinc-300"
            }`}
          >
            {session.revealed ? "Revealed" : "Voting"}
          </div>
        </div>

        {isOrganizer && (
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Label htmlFor="share-link" className="text-zinc-400">
                Share link
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="share-link"
                  readOnly
                  value={shareUrl}
                  className="border-white/10 bg-transparent text-sm text-zinc-300"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
            {!session.revealed && (
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleSkipRound()}
                className="w-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300 sm:w-auto"
              >
                New task
              </Button>
            )}
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-500">
          Your vote
        </h2>
        <VoteBoard
          session={session}
          myParticipantId={participantId}
          disabled={busy}
          onVote={handleVote}
        />
        {session.revealed && (
          <p className="text-sm text-zinc-400">
            {isOrganizer
              ? "Votes are visible. Pick the final points and submit, then name the next task."
              : "Votes are visible. Waiting for the organizer to lock agreed points."}
          </p>
        )}
      </section>

      <ParticipantList session={session} myParticipantId={participantId} />

      {isOrganizer && (
        <OrganizerControls
          session={session}
          busy={busy}
          onReveal={handleReveal}
          onHideVotes={handleHideVotes}
          onSubmitFinal={handleSubmitFinal}
        />
      )}

      <TaskHistory history={session.history ?? []} />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
