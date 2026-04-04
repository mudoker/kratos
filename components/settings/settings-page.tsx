"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/components/shared/data-provider";

export function SettingsPage() {
  const data = useData();
  const router = useRouter();
  const [profile, setProfile] = useState(data.profile);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setStatus("");
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Could not save profile.");
      setSaving(false);
      return;
    }
    setStatus("Profile saved.");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-6">
        <PageHeader
          eyebrow="Settings"
          title="Keep the planning context accurate."
          description="The more honest the profile and constraints, the better the plan editor and AI coach will behave."
          actions={
            <Button type="button" onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save profile"}
            </Button>
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Goal</p>
            <Input value={profile.goal} onChange={(event) => setProfile((current) => ({ ...current, goal: event.target.value }))} placeholder="Primary goal" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Experience</p>
            <Select value={profile.experienceLevel} onValueChange={(value) => setProfile((current) => ({ ...current, experienceLevel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Weekly sessions</p>
            <Input
              type="number"
              min="1"
              max="7"
              value={String(profile.weeklySessions)}
              onChange={(event) => setProfile((current) => ({ ...current, weeklySessions: Number(event.target.value) }))}
              placeholder="Weekly sessions"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Body model</p>
            <Select value={profile.bodyGender} onValueChange={(value) => setProfile((current) => ({ ...current, bodyGender: value as "male" | "female" }))}>
              <SelectTrigger>
                <SelectValue placeholder="Body map model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male body map</SelectItem>
                <SelectItem value="female">Female body map</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Age</p>
            <Input
              type="number"
              min="1"
              value={String(profile.age || "")}
              onChange={(event) => setProfile((current) => ({ ...current, age: Number(event.target.value) }))}
              placeholder="Age"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Weight (kg)</p>
              <Input
                type="number"
                min="1"
                value={String(profile.weight || "")}
                onChange={(event) => setProfile((current) => ({ ...current, weight: Number(event.target.value) }))}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Height (cm)</p>
              <Input
                type="number"
                min="1"
                value={String(profile.height || "")}
                onChange={(event) => setProfile((current) => ({ ...current, height: Number(event.target.value) }))}
                placeholder="cm"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Injuries and restrictions</p>
          <Textarea
            value={profile.injuries}
            onChange={(event) => setProfile((current) => ({ ...current, injuries: event.target.value }))}
            placeholder="Injuries, pain triggers, or movement restrictions"
          />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Additional notes</p>
          <Textarea
            value={profile.notes}
            onChange={(event) => setProfile((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Schedule constraints, preferred lifts, equipment access, or recovery notes"
          />
        </div>

        {status ? <Badge className="mt-5">{status}</Badge> : null}
      </Card>

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          Account summary
        </p>
        <CardTitle className="mt-2">{data.user.name}</CardTitle>
        <CardDescription className="mt-2">{data.user.email}</CardDescription>

        <div className="mt-6 grid gap-3">
          {[
            ["Plans", String(data.plans.length)],
            ["Sessions", String(data.sessions.length)],
            ["PR records", String(data.records.length)],
            ["Coach messages", String(data.coachMessages.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">{label}</p>
              <p className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
