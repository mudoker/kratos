"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Target, Trophy, Trash2, Edit2, X, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData, PersonalRecord } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCharts } from "./progress-charts";

const blankRecord = (): Omit<PersonalRecord, "id" | "userId"> & { id?: string } => ({
  id: undefined,
  exerciseId: "",
  value: 0,
  unit: "kg",
  reps: 1,
  achievedAt: new Date().toISOString().slice(0, 10),
  notes: "",
});

export function ProgressPage({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [records, setRecords] = useState(data.records);
  const [form, setForm] = useState(blankRecord());
  const [status, setStatus] = useState("");

  const exerciseOptions = useMemo(
    () => data.exercises.map((exercise) => ({ value: exercise.id, label: exercise.name })),
    [data.exercises]
  );

  const saveRecord = async () => {
    setStatus("");
    const isEdit = Boolean(form.id);
    const response = await fetch("/api/records", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as { record?: PersonalRecord; error?: string };
    if (!response.ok || !payload.record) {
      setStatus(payload.error || "Could not save PR.");
      return;
    }

    setRecords((current) => [payload.record!, ...current.filter((record) => record.id !== payload.record!.id)]);
    setForm(blankRecord());
    setStatus(isEdit ? "PR updated." : "PR saved.");
    router.refresh();
  };

  const startEdit = (record: PersonalRecord) => {
    setForm({
      id: record.id,
      exerciseId: record.exerciseId,
      value: record.value,
      unit: record.unit,
      reps: record.reps,
      achievedAt: new Date(record.achievedAt).toISOString().slice(0, 10),
      notes: record.notes,
    });
    setStatus("Editing PR...");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this PR?")) return;
    const response = await fetch(`/api/records?id=${recordId}`, { method: "DELETE" });
    if (response.ok) {
      setRecords((current) => current.filter((r) => r.id !== recordId));
      if (form.id === recordId) {
        setForm(blankRecord());
        setStatus("");
      }
      router.refresh();
    }
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0 outline-none">
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="p-6">
            <PageHeader
              eyebrow="Progress Lab"
              title="Track PRs without crowding the plan builder."
              description="Keep performance records, momentum, and recent breakthroughs in a separate surface from programming."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Total PRs
                </p>
                <p className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
                  {records.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Sessions logged
                </p>
                <p className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
                  {data.sessions.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Active plans
                </p>
                <p className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
                  {data.plans.length}
                </p>
              </div>
            </div>

            <Card className="mt-6 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                  <Trophy className="h-4 w-4 text-[color:var(--brand)]" />
                  <CardTitle className="text-lg">{form.id ? "Edit personal record" : "Log a personal record"}</CardTitle>
                </div>
                {form.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm(blankRecord());
                      setStatus("");
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                    Exercise
                  </p>
                  <Combobox
                    options={exerciseOptions}
                    value={form.exerciseId}
                    onValueChange={(value) => setForm((current) => ({ ...current, exerciseId: value }))}
                    placeholder="Search exercise..."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                      Value
                    </p>
                    <Input
                      type="number"
                      min="0"
                      value={String(form.value)}
                      onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))}
                      placeholder="Value"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                      Unit
                    </p>
                    <Select
                      value={form.unit}
                      onValueChange={(value) => setForm((current) => ({ ...current, unit: value as PersonalRecord["unit"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="reps">reps</SelectItem>
                        <SelectItem value="seconds">seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                      Reps
                    </p>
                    <Input
                      type="number"
                      min="1"
                      value={String(form.reps)}
                      onChange={(event) => setForm((current) => ({ ...current, reps: Number(event.target.value) }))}
                      placeholder="Reps"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                    Date achieved
                  </p>
                  <Input
                    type="date"
                    value={form.achievedAt}
                    onChange={(event) => setForm((current) => ({ ...current, achievedAt: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                    Notes
                  </p>
                  <Textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Context: bodyweight, machine, block, fatigue, or technique notes"
                    className="min-h-[100px]"
                  />
                </div>
                <Button type="button" className="w-full" onClick={saveRecord} disabled={!form.exerciseId}>
                  {form.id ? "Update PR" : "Save PR"}
                </Button>
              </div>
            </Card>

            {status ? <Badge className="mt-5">{status}</Badge> : null}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                <Target className="h-4 w-4 text-[color:var(--support)]" />
                <CardTitle className="text-lg">Recent breakthroughs</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Keep the most recent lifts visible when you adjust load targets in the planner.
              </CardDescription>
              <div className="mt-6 space-y-6">
                {records.length ? (
                  Object.entries(
                    records.reduce((acc, record) => {
                      const exercise = data.exercises.find((e) => e.id === record.exerciseId);
                      const category = exercise?.category || "Other";
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(record);
                      return acc;
                    }, {} as Record<string, PersonalRecord[]>)
                  ).map(([category, catRecords]) => (
                    <div key={category} className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] opacity-60">
                        {category}
                      </p>
                      {catRecords.slice(0, 5).map((record) => {
                        const exercise = data.exercises.find((entry) => entry.id === record.exerciseId);
                        return (
                          <div
                            key={record.id}
                            className="group relative rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4 transition hover:bg-white/80"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-[color:var(--foreground)]">{exercise?.name || record.exerciseId}</p>
                                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                                  {new Date(record.achievedAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge>
                                  {record.value} {record.unit} x {record.reps}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-full p-0 opacity-0 transition group-hover:opacity-100"
                                  onClick={() => startEdit(record)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-full p-0 text-[color:var(--danger)] opacity-0 transition group-hover:opacity-100 hover:bg-[color:var(--danger-soft)]"
                                  onClick={() => removeRecord(record.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {record.notes ? (
                              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">{record.notes}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <p className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] p-5 text-sm text-[color:var(--muted-foreground)]">
                    No PRs yet. Start logging records here instead of burying them inside the weekly planner.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                <ArrowUpRight className="h-4 w-4 text-[color:var(--brand)]" />
                <CardTitle className="text-lg">Momentum cues</CardTitle>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  `${data.sessions.length} sessions logged. Use Workout Studio to keep effort notes attached to each day.`,
                  `${data.plans.length} active plans. Keep old blocks around so the coach can compare phases.`,
                  `${records.length} PR records. Translate the best lifts into target-load updates on the planner page.`,
                ].map((line) => (
                  <div
                    key={line}
                    className="rounded-[22px] border border-[color:var(--border)] bg-white/60 p-4 text-sm leading-6 text-[color:var(--muted-foreground)]"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="mt-0 outline-none">
        <ProgressCharts data={data} />
      </TabsContent>
    </Tabs>
  );
}
