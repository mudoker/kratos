"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Trophy, Trash2, Edit2, BarChart3, Plus, CalendarDays, Check, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PersonalRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const recentSessions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return data.sessions.filter((session) => new Date(session.startedAt) >= cutoff);
  }, [data.sessions]);
  const latestRecord = records[0];
  const latestExercise = latestRecord
    ? data.exercises.find((exercise) => exercise.id === latestRecord.exerciseId)
    : null;

  return (
    <div className="space-y-3 pb-16 lg:space-y-6 lg:pb-0">
      
      {/* Visual Header Panel */}
      <div className="rounded-xl bg-brand p-2.5 text-background shadow-lg relative overflow-hidden md:rounded-[28px] md:p-8 md:shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex items-center justify-between gap-3 md:gap-6">
          <div className="space-y-1 md:space-y-2">
            <Badge className="hidden bg-card/10 hover:bg-card/20 border-transparent text-background/60 font-bold uppercase tracking-widest text-[9px] px-3 py-1 sm:inline-flex">
              Progress
            </Badge>
            <h1 className="text-base font-semibold tracking-tight leading-tight text-background sm:text-lg md:text-4xl md:font-black">
              Records
            </h1>
            <p className="hidden text-background/55 text-[11px] md:block md:text-sm max-w-xl font-medium leading-snug md:leading-relaxed">
              Track PRs and strength trends.
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-7 w-auto rounded-lg border-none bg-card px-2.5 text-[11px] font-semibold text-foreground shadow-md transition duration-200 hover:bg-card/90 md:h-10 md:rounded-xl md:px-4 md:text-xs" onClick={() => setForm(blankRecord())}>
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                <span>Log</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl p-5 max-w-md bg-card border border-border-strong">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>{form.id ? "Edit Personal Record" : "Log Personal Record"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/50 mt-1 leading-relaxed">
                  Save a lift, rep max, or performance marker.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Select Exercise</label>
                  <Combobox
                    options={exerciseOptions}
                    value={form.exerciseId}
                    onValueChange={(value) => setForm((current) => ({ ...current, exerciseId: value }))}
                    placeholder="Search exercise..."
                  />
                </div>

                <div className="grid gap-3 grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Weight</label>
                    <Input
                      type="number"
                      value={String(form.value)}
                      onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))}
                      className="h-9 rounded-xl border-border bg-foreground/5 py-2 text-xs focus:border-black/20 focus:bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Unit</label>
                    <Select
                      value={form.unit}
                      onValueChange={(value) => setForm((current) => ({ ...current, unit: value as PersonalRecord["unit"] }))}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border bg-foreground/5 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="reps">reps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Reps</label>
                    <Input
                      type="number"
                      value={String(form.reps)}
                      onChange={(event) => setForm((current) => ({ ...current, reps: Number(event.target.value) }))}
                      className="h-9 rounded-xl border-border bg-foreground/5 py-2 text-xs focus:border-black/20 focus:bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Date Achieved</label>
                  <Input
                    type="date"
                    value={form.achievedAt}
                    onChange={(event) => setForm((current) => ({ ...current, achievedAt: event.target.value }))}
                    className="h-9 rounded-xl border-border bg-foreground/5 py-2 text-xs focus:border-black/20 focus:bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Notes</label>
                  <Textarea
                    value={form.notes || ""}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Optional setup or effort notes..."
                    className="min-h-[56px] rounded-xl border-border bg-foreground/5 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border">
                  <Button type="button" className="h-10 rounded-xl bg-brand hover:bg-brand/90 text-background font-semibold text-xs shadow-md w-full border-none" onClick={saveRecord} disabled={!form.exerciseId}>
                    <span>{form.id ? "Update PR" : "Save PR"}</span>
                  </Button>
                </div>
                {status ? (
                  <p className="text-center text-[11px] font-semibold text-foreground/50">{status}</p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {[
          {
            label: "Last 30 days",
            value: `${recentSessions.length}`,
            detail: "workouts logged",
            icon: Check,
          },
          {
            label: "Tracked PRs",
            value: `${records.length}`,
            detail: "records saved",
            icon: Award,
          },
          {
            label: "Latest PR",
            value: latestRecord ? `${latestRecord.value}${latestRecord.unit}` : "None",
            detail: latestExercise?.name || "Log a record",
            icon: Trophy,
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-xl border-transparent bg-card/80 p-2 shadow-[0_10px_24px_rgba(0,0,0,0.03)] sm:rounded-2xl sm:p-3.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <p className="truncate text-[7.5px] font-extrabold uppercase tracking-wider text-foreground/40 sm:text-[9px]">{item.label}</p>
                <p className="mt-0.5 truncate text-xs font-semibold leading-none text-foreground sm:mt-1 sm:text-base">{item.value}</p>
                <p className="mt-1 hidden truncate text-[10px] font-semibold text-foreground/40 sm:block">{item.detail}</p>
              </div>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-background sm:flex">
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Tabs Workspace layout */}
      <Tabs defaultValue="analytics" className="space-y-3 md:space-y-6 flex flex-col flex-1">
        <TabsList className="grid w-full shrink-0 grid-cols-2 items-center gap-1 bg-foreground/5 p-1 rounded-xl md:inline-flex md:w-fit md:flex-wrap md:gap-2 md:p-1.5 md:rounded-2xl">
          <TabsTrigger value="analytics" className="h-7 rounded-lg px-3 py-0 text-[11px] font-semibold gap-1.5 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground md:h-auto md:px-4 md:py-2.5 md:text-xs md:rounded-xl">
            <BarChart3 className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="h-7 rounded-lg px-3 py-0 text-[11px] font-semibold gap-1.5 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground md:h-auto md:px-4 md:py-2.5 md:text-xs md:rounded-xl">
            <Trophy className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 outline-none space-y-3 md:space-y-6">
          <ProgressCharts data={data} />
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6 items-start">
            
            {/* PR list by categories */}
            <div className="space-y-5 md:space-y-8">
              {Object.entries(prGroups).map(([category, catRecords]) => (
                <div key={category} className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/45">
                      {category} Category
                    </span>
                    <div className="h-px flex-1 bg-foreground/5" />
                  </div>
                  
                  <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {catRecords.map((record) => {
                      const exercise = data.exercises.find((entry) => entry.id === record.exerciseId);
                      return (
                        <div
                          key={record.id}
                          className="group relative rounded-2xl border border-border bg-card/60 p-3.5 hover:bg-card/80 hover:shadow-sm transition duration-300 sm:p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-xs text-foreground leading-tight sm:text-sm">{exercise?.name || record.exerciseId}</p>
                              <p className="text-[10px] text-foreground/40 mt-1 font-semibold flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{new Date(record.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-brand text-background text-[9px] font-extrabold py-0.5 px-2">
                                {record.value}{record.unit} x {record.reps}
                              </Badge>
                              <div className="flex items-center">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-foreground/5" onClick={() => startEdit(record)}>
                                  <Edit2 className="h-3 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 rounded-md" onClick={() => removeRecord(record.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <p className="mt-2 text-[11px] text-foreground/50 leading-relaxed italic border-t border-border pt-1.5">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Consistency cues sidebar */}
            <div className="hidden space-y-6 xl:block">
              <Card className="p-6 md:p-8 border-transparent bg-card/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-2 bg-brand/[0.04] text-foreground/60 rounded-xl">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/55">PR notes</span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Helpful cues</CardTitle>
                <div className="mt-5 space-y-4">
                  {[
                    "New PRs are automatically extracted from your live workout execution logs.",
                    "Track the trajectory of compound loads inside the Progression Analytics tab.",
                    "Higher load weight or rep increments automatically update your physical baseline."
                  ].map((line, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-card/45 p-4 text-xs leading-relaxed text-foreground/60 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand/35" />
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
