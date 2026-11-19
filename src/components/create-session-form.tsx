"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadDisplayName,
  saveDisplayName,
  saveOrganizerToken,
  saveParticipantId,
} from "@/lib/client-storage";

export function CreateSessionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(loadDisplayName());
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerName: name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not create session");
      }
      saveDisplayName(data.session.organizerName);
      saveOrganizerToken(data.session.id, data.organizerToken);
      saveParticipantId(data.session.id, data.participantId);
      router.push(`/s/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="organizer-name" className="text-zinc-300">
          Your name
        </Label>
        <Input
          id="organizer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          autoComplete="nickname"
          required
          maxLength={40}
          className="h-12 border-white/10 bg-white/[0.04] text-base text-zinc-100 placeholder:text-zinc-500"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="h-12 w-full bg-emerald-400 text-base font-semibold text-zinc-950 hover:bg-emerald-300"
      >
        {loading ? "Creating…" : "Start session"}
      </Button>
    </form>
  );
}
