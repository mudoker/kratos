"use client";

import { useMemo, useState } from "react";
import { SendHorizonal } from "lucide-react";
import type { CoachMessage, DashboardData } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));

export function CoachPage({ data }: { data: DashboardData }) {
  const [messages, setMessages] = useState<CoachMessage[]>(data.coachMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const latestRecord = data.records[0];
  const latestSession = data.sessions[0];
  const latestPlan = data.plans[0];
  const latestRecordLabel = useMemo(() => {
    if (!latestRecord) return "No PR logged yet";
    const exercise = data.exercises.find((item) => item.id === latestRecord.exerciseId);
    return `${exercise?.name || latestRecord.exerciseId} • ${latestRecord.value} ${latestRecord.unit} x ${latestRecord.reps}`;
  }, [data.exercises, latestRecord]);

  const send = async () => {
    if (!input.trim()) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const payload = (await response.json()) as { message?: string; messages?: CoachMessage[]; error?: string };
    if (!response.ok || !payload.message) {
      setError(payload.error || "The coach could not respond.");
      setPending(false);
      return;
    }

    const nextMessages = payload.messages ?? [
      ...messages,
      {
        id: `local-user-${Date.now()}`,
        userId: data.user.id,
        role: "user",
        content: input,
        createdAt: new Date().toISOString(),
      },
      {
        id: `local-assistant-${Date.now() + 1}`,
        userId: data.user.id,
        role: "assistant",
        content: payload.message,
        createdAt: new Date().toISOString(),
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setPending(false);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="p-6">
        <PageHeader
          eyebrow="Coach"
          title="Ask for adjustments with real training context."
          description="Text responses use your profile, recent plans, PR records, and completed sessions."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Current goal", data.profile.goal || "Not set"],
            ["Weekly target", data.profile.weeklySessions ? `${data.profile.weeklySessions} sessions` : "Not set"],
            ["Latest plan", latestPlan?.name || "No plan saved"],
            ["Latest PR", latestRecordLabel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                {label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Review my current weekly volume and recovery risk.",
            "Adjust next week based on my latest sessions.",
            "Find PR opportunities in this split.",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="rounded-full border border-[color:var(--border)] bg-white/60 px-4 py-2 text-sm text-[color:var(--muted-foreground)] transition hover:bg-white/80 hover:text-[color:var(--foreground)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#161616,#202020)] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/62">Current context</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="border-white/14 bg-white/10 text-white">{data.plans.length} plans</Badge>
            <Badge className="border-white/14 bg-white/10 text-white">{data.sessions.length} logged sessions</Badge>
            <Badge className="border-white/14 bg-white/10 text-white">{data.records.length} PR records</Badge>
            <Badge className="border-white/14 bg-white/10 text-white">
              {latestSession ? `Last session ${formatDate(latestSession.startedAt)}` : "No sessions yet"}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="flex min-h-[720px] flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              Conversation
            </p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold text-[color:var(--foreground)]">
              Coaching thread
            </h2>
          </div>
          <Badge>{messages.length} messages</Badge>
        </div>

        <ScrollArea className="mt-6 flex-1 rounded-[28px] border border-[color:var(--border)] bg-white/55 p-4">
          <div className="space-y-3">
            {messages.length ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-[24px] border px-4 py-3 text-sm leading-7 ${
                    message.role === "assistant"
                      ? "border-[color:var(--border)] bg-black/5 text-[color:var(--foreground)]"
                      : "ml-auto border-black bg-black text-white"
                  }`}
                >
                  {message.content}
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Ask about readiness, programming changes, or what to prioritize next week.
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
    </div>
  );
}
