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
    <div className="space-y-4 lg:space-y-6">
      
      {/* Visual Header Panel */}
      <div className="rounded-2xl bg-black p-4 text-white shadow-lg relative overflow-hidden md:rounded-[36px] md:p-10 md:shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1.5 md:space-y-2">
            <Badge className="hidden bg-white/10 hover:bg-white/20 border-transparent text-white/60 font-bold uppercase tracking-widest text-[9px] px-3 py-1 sm:inline-flex">
              Progress
            </Badge>
            <h1 className="text-xl md:text-5xl font-black tracking-tight leading-tight text-white">
              Personal records
            </h1>
            <p className="text-white/55 text-[11px] md:text-base max-w-xl font-medium leading-snug md:leading-relaxed">
              Track PRs and strength trends.
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 w-full px-4 bg-white hover:bg-white/90 text-neutral-900 font-semibold text-xs rounded-xl shadow-md border-none flex items-center gap-2 transition duration-200 md:h-12 md:w-auto md:px-5" onClick={() => setForm(blankRecord())}>
                <Plus className="h-4 w-4" />
                <span>Log PR</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-6 max-w-md bg-white border border-black/10">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>{form.id ? "Edit Personal Record" : "Log Personal Record"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-black/50 mt-1 leading-relaxed">
                  Save a lift, rep max, or performance marker.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Select Exercise</label>
                  <Combobox
                    options={exerciseOptions}
                    value={form.exerciseId}
                    onValueChange={(value) => setForm((current) => ({ ...current, exerciseId: value }))}
                    placeholder="Search exercise..."
                  />
                </div>

                <div className="grid gap-3 grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Weight</label>
                    <Input
                      type="number"
                      value={String(form.value)}
                      onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))}
                      className="bg-black/5 border-black/5 rounded-xl py-2 text-xs focus:border-black/20 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Unit</label>
                    <Select
                      value={form.unit}
                      onValueChange={(value) => setForm((current) => ({ ...current, unit: value as PersonalRecord["unit"] }))}
                    >
                      <SelectTrigger className="bg-black/5 border-black/5 rounded-xl text-xs">
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Reps</label>
                    <Input
                      type="number"
                      value={String(form.reps)}
                      onChange={(event) => setForm((current) => ({ ...current, reps: Number(event.target.value) }))}
                      className="bg-black/5 border-black/5 rounded-xl py-2 text-xs focus:border-black/20 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Date Achieved</label>
                  <Input
                    type="date"
                    value={form.achievedAt}
                    onChange={(event) => setForm((current) => ({ ...current, achievedAt: event.target.value }))}
                    className="bg-black/5 border-black/5 rounded-xl py-2 text-xs focus:border-black/20 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Notes</label>
                  <Textarea
                    value={form.notes || ""}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Optional setup or effort notes..."
                    className="bg-black/5 border-black/5 rounded-xl text-xs min-h-[60px]"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-black/5">
                  <Button type="button" className="h-11 rounded-xl bg-black hover:bg-black/90 text-white font-semibold text-xs shadow-md w-full border-none" onClick={saveRecord} disabled={!form.exerciseId}>
                    <span>{form.id ? "Update PR" : "Save PR"}</span>
                  </Button>
                </div>
                {status ? (
                  <p className="text-center text-[11px] font-semibold text-black/50">{status}</p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
          <Card key={item.label} className="border-transparent bg-white/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">{item.label}</p>
                <p className="mt-1 text-xl font-black leading-none text-black">{item.value}</p>
                <p className="mt-1 truncate text-[10px] font-semibold text-black/40">{item.detail}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                <item.icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Tabs Workspace layout */}
      <Tabs defaultValue="analytics" className="space-y-4 md:space-y-6 flex flex-col flex-1">
        <TabsList className="grid w-full shrink-0 grid-cols-2 items-center gap-1 bg-black/5 p-1 rounded-xl md:inline-flex md:w-fit md:flex-wrap md:gap-2 md:p-1.5 md:rounded-2xl">
          <TabsTrigger value="analytics" className="px-3 py-2 text-xs font-bold rounded-lg gap-1.5 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black md:px-4 md:py-2.5 md:rounded-xl">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="px-3 py-2 text-xs font-bold rounded-lg gap-1.5 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black md:px-4 md:py-2.5 md:rounded-xl">
            <Trophy className="h-3.5 w-3.5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 outline-none space-y-4 md:space-y-6">
          <ProgressCharts data={data} />
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6 items-start">
            
            {/* PR list by categories */}
            <div className="space-y-5 md:space-y-8">
              {Object.entries(prGroups).map(([category, catRecords]) => (
                <div key={category} className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">
                      {category} Category
                    </span>
                    <div className="h-px flex-1 bg-black/5" />
                  </div>
                  
                  <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {catRecords.map((record) => {
                      const exercise = data.exercises.find((entry) => entry.id === record.exerciseId);
                      return (
                        <div
                          key={record.id}
                          className="group relative rounded-2xl border border-black/5 bg-white/60 p-3.5 hover:bg-white/80 hover:shadow-sm transition duration-300 sm:p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-xs text-black leading-tight sm:text-sm">{exercise?.name || record.exerciseId}</p>
                              <p className="text-[10px] text-black/40 mt-1 font-semibold flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{new Date(record.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-black text-white text-[9px] font-extrabold py-0.5 px-2">
                                {record.value}{record.unit} x {record.reps}
                              </Badge>
                              <div className="flex items-center">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-black/5" onClick={() => startEdit(record)}>
                                  <Edit2 className="h-3 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 rounded-md" onClick={() => removeRecord(record.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <p className="mt-2 text-[11px] text-black/50 leading-relaxed italic border-t border-black/5 pt-1.5">
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
              <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">PR notes</span>
                </div>
                <CardTitle className="text-lg font-bold text-black">Helpful cues</CardTitle>
                <div className="mt-5 space-y-4">
                  {[
                    "New PRs are automatically extracted from your live workout execution logs.",
                    "Track the trajectory of compound loads inside the Progression Analytics tab.",
                    "Higher load weight or rep increments automatically update your physical baseline."
                  ].map((line, idx) => (
                    <div key={idx} className="rounded-2xl border border-black/5 bg-white/45 p-4 text-xs leading-relaxed text-black/60 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
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
