"use client";

import { useMemo, useState } from "react";
import { SendHorizonal } from "lucide-react";
import type { CoachMessage } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/components/shared/data-provider";

export function CoachPage() {
  const data = useData();
  const [messages, setMessages] = useState<CoachMessage[]>(data.coachMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const recentSessions = useMemo(() => data.sessions.slice(0, 5), [data.sessions]);

  const send = async () => {
    if (!input.trim() || pending) return;

    setPending(true);
    setError("");
    const message = input.trim();
    setInput("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const payload = (await response.json()) as { message?: string; messages?: CoachMessage[]; error?: string };
      if (!response.ok || !payload.messages) {
        throw new Error(payload.error || "Failed to get a response from the coach.");
      }

      setMessages(payload.messages);
    } catch (err: any) {
      setError(err.message);
      setInput(message); // Restore input on error
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card className="flex h-[760px] flex-col p-6">
        <PageHeader
          eyebrow="AI Intelligence"
          title="Kratos Coach"
          description="A data-driven strength and physique assistant that understands your history and intent."
        />

        <ScrollArea className="mt-6 flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {messages.length ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[26px] px-5 py-4 text-sm leading-7 ${
                      msg.role === "user"
                        ? "bg-[color:var(--brand)] text-white shadow-lg"
                        : "border-[color:var(--border)] bg-black/5 text-[color:var(--foreground)]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] p-5 text-sm text-[color:var(--muted-foreground)]">
                Start a conversation to get an audit of your weekly split, suggestions for load management, or technical cues for specific lifts.
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
              Your message
            </p>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Ask the coach to audit your split, suggest load changes, or review a PR attempt."
              className="min-h-[140px]"
            />
          </div>
          {error ? <p className="text-sm font-medium text-[color:var(--danger)]">{error}</p> : null}
          <Button type="button" onClick={send} disabled={pending || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
            {pending ? "Thinking..." : "Send to coach"}
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <CardTitle className="text-lg">Recent context</CardTitle>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            The coach uses your profile, latest plan, and recent session performance to anchor its advice.
          </p>

          <div className="mt-6 space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="rounded-[22px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{session.title}</p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  {new Date(session.startedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle className="text-lg">Athlete stats</CardTitle>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              ["Experience", data.profile.experienceLevel],
              ["Sessions/wk", String(data.profile.weeklySessions)],
              ["Total PRs", String(data.records.length)],
              ["Goal", data.profile.goal || "Strength"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)] opacity-60">
                  {label}
                </p>
                <p className="mt-1 font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
