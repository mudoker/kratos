"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Target, Trophy, Trash2, Edit2, X, BarChart3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PersonalRecord } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProgressCharts } from "./progress-charts";
import { useData } from "@/components/shared/data-provider";

const blankRecord = (): Omit<PersonalRecord, "id" | "userId"> & { id?: string } => ({
  id: undefined,
  exerciseId: "",
  value: 0,
  unit: "kg",
  reps: 1,
  achievedAt: new Date().toISOString().slice(0, 10),
  notes: "",
});

export function ProgressPage() {
  const data = useData();
  const router = useRouter();
  const [records, setRecords] = useState(data.records);
  const [form, setForm] = useState(blankRecord());
  const [status, setStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);
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
    setIsModalOpen(true);
  };

  const removeRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this PR?")) return;
    const response = await fetch(`/api/records?id=${recordId}`, { method: "DELETE" });
    if (response.ok) {
      setRecords((current) => current.filter((r) => r.id !== recordId));
      router.refresh();
    }
  };

  const prGroups = useMemo(() => {
    return records.reduce((acc, record) => {
      const exercise = data.exercises.find((e) => e.id === record.exerciseId);
      const category = exercise?.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(record);
      return acc;
    }, {} as Record<string, PersonalRecord[]>);
  }, [records, data.exercises]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Progress Lab"
          title="Performance Analytics"
          description="A comprehensive view of your training trajectory and historical breakthroughs."
        />
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setForm(blankRecord())}>
              <Plus className="h-4 w-4" />
              Manual PR Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px]">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Personal Record" : "Log a Personal Record"}</DialogTitle>
            </DialogHeader>
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
              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                    Weight
                  </p>
                  <Input
                    type="number"
                    value={String(form.value)}
                    onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                    Reps
                  </p>
                  <Input
                    type="number"
                    value={String(form.reps)}
                    onChange={(event) => setForm((current) => ({ ...current, reps: Number(event.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                  Date
                </p>
                <Input
                  type="date"
                  value={form.achievedAt}
                  onChange={(event) => setForm((current) => ({ ...current, achievedAt: event.target.value }))}
                />
              </div>
              <Button type="button" className="w-full mt-2" onClick={saveRecord} disabled={!form.exerciseId}>
                {form.id ? "Update Record" : "Save Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Progression Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Trophy className="h-3.5 w-3.5" />
            Breakthrough History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 outline-none space-y-6">
          <ProgressCharts data={data} />
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <CardTitle className="text-sm">Total PRs</CardTitle>
              <p className="mt-2 font-[family:var(--font-display)] text-3xl font-bold text-[color:var(--foreground)]">
                {records.length}
              </p>
              <CardDescription className="mt-1">Historical milestones</CardDescription>
            </Card>
            <Card className="p-6">
              <CardTitle className="text-sm">Active Stimulus</CardTitle>
              <p className="mt-2 font-[family:var(--font-display)] text-3xl font-bold text-[color:var(--support)]">
                {Object.keys(prGroups).length}
              </p>
              <CardDescription className="mt-1">Targeted muscle groups</CardDescription>
            </Card>
            <Card className="p-6">
              <CardTitle className="text-sm">Sessions Logged</CardTitle>
              <p className="mt-2 font-[family:var(--font-display)] text-3xl font-bold text-[color:var(--brand)]">
                {data.sessions.length}
              </p>
              <CardDescription className="mt-1">Training consistency</CardDescription>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
            <div className="space-y-8">
              {Object.entries(prGroups).map(([category, catRecords]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-[color:var(--border)]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] opacity-60">
                      {category}
                    </span>
                    <div className="h-px flex-1 bg-[color:var(--border)]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {catRecords.map((record) => {
                      const exercise = data.exercises.find((entry) => entry.id === record.exerciseId);
                      return (
                        <div
                          key={record.id}
                          className="group relative rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4 transition hover:bg-white/80"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[color:var(--foreground)]">{exercise?.name || record.exerciseId}</p>
                              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                                {new Date(record.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-black/5 text-[color:var(--foreground)] border-none">
                                {record.value}{record.unit} x {record.reps}
                              </Badge>
                              <div className="flex opacity-0 transition group-hover:opacity-100">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(record)}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[color:var(--danger)]" onClick={() => removeRecord(record.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                  <ArrowUpRight className="h-4 w-4 text-[color:var(--brand)]" />
                  <CardTitle className="text-lg">Consistency Cues</CardTitle>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    "New PRs are automatically extracted from your live workout sessions.",
                    "Track the trajectory of your core compound lifts in the Analytics tab.",
                    "Higher weight or higher reps at the same weight trigger an automatic breakthrough log."
                  ].map((line, idx) => (
                    <div key={idx} className="rounded-2xl border border-[color:var(--border)] bg-white/60 p-4 text-xs leading-6 text-[color:var(--muted-foreground)]">
                      {line}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
