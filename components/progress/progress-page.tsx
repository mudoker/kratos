"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Target, Trophy, Trash2, Edit2, X, BarChart3, Plus, Sparkles, CalendarDays, Check, Flame, Award } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ProgressCharts } from "./progress-charts";
import { useData } from "@/components/shared/data-provider";
import { cn } from "@/lib/utils";

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
    setStatus(isEdit ? "PR updated successfully." : "PR saved successfully.");
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
      
      {/* Visual Header Panel */}
      <div className="rounded-[36px] bg-gradient-to-r from-violet-950 via-slate-900 to-black p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-white/10 hover:bg-white/20 border-transparent text-violet-400 font-bold uppercase tracking-widest text-[9px] px-3 py-1">
              Active Progression Lab
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              PR & Momentum Vault
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Trace compound lift progression curves, evaluate muscle volume indices, and list historical athletic breakthroughs.
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-5 bg-white hover:bg-white/90 text-neutral-900 font-semibold text-xs rounded-xl shadow-md border-none flex items-center gap-2 transition duration-200" onClick={() => setForm(blankRecord())}>
                <Plus className="h-4 w-4" />
                <span>Log Manual PR</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-6 max-w-md bg-white border border-black/10">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>{form.id ? "Edit Personal Record" : "Log Personal Record"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-black/50 mt-1 leading-relaxed">
                  Log a compound lift breakthrough or performance marker to update your athletic records database.
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
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Notes & Strategy Cues</label>
                  <Textarea
                    value={form.notes || ""}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Execution details, machine seating configuration, path angle..."
                    className="bg-black/5 border-black/5 rounded-xl text-xs min-h-[60px]"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-black/5">
                  <Button type="button" className="h-11 rounded-xl bg-black hover:bg-black/90 text-white font-semibold text-xs shadow-md w-full border-none" onClick={saveRecord} disabled={!form.exerciseId}>
                    <span>{form.id ? "Update Breakthrough" : "Log Breakthrough"}</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Tabs Workspace layout */}
      <Tabs defaultValue="analytics" className="space-y-6 flex flex-col flex-1">
        <TabsList className="shrink-0 flex flex-wrap gap-2 items-center bg-black/5 p-1.5 rounded-2xl w-fit">
          <TabsTrigger value="analytics" className="px-4 py-2.5 text-xs font-bold rounded-xl gap-1.5 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Progression Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="px-4 py-2.5 text-xs font-bold rounded-xl gap-1.5 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black">
            <Trophy className="h-3.5 w-3.5 animate-pulse" />
            <span>Breakthrough History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 outline-none space-y-6">
          <ProgressCharts data={data} />
          
          {/* Key Metrics cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Active Milestones", value: records.length, desc: "Historical breakthroughs logged", color: "text-amber-500 bg-amber-50", icon: Award },
              { label: "Targeted Regions", value: Object.keys(prGroups).length, desc: "Stimulated muscle categories", color: "text-indigo-500 bg-indigo-50", icon: Target },
              { label: "Completed Sessions", value: data.sessions.length, desc: "Consistency telemetry checked", color: "text-emerald-500 bg-emerald-50", icon: Check },
            ].map((item) => (
              <Card key={item.label} className="p-5 border-transparent bg-white/70 backdrop-blur shadow-[0_10px_35px_rgba(0,0,0,0.03)] rounded-2xl flex items-center gap-4 hover:border-black/5 hover:bg-white/80 transition duration-300">
                <div className={cn("p-3 rounded-xl", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">{item.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-black leading-none">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-black/35 mt-1 leading-none">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] items-start">
            
            {/* PR list by categories */}
            <div className="space-y-8">
              {Object.entries(prGroups).map(([category, catRecords]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">
                      {category} Category
                    </span>
                    <div className="h-px flex-1 bg-black/5" />
                  </div>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catRecords.map((record) => {
                      const exercise = data.exercises.find((entry) => entry.id === record.exerciseId);
                      return (
                        <div
                          key={record.id}
                          className="group relative rounded-2xl border border-black/5 bg-white/45 p-4 hover:bg-white/80 hover:shadow-sm transition duration-300"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-black leading-tight">{exercise?.name || record.exerciseId}</p>
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
            <div className="space-y-6">
              <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">Breakthrough Telemetry</span>
                </div>
                <CardTitle className="text-lg font-bold text-black">Consistency Cues</CardTitle>
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
