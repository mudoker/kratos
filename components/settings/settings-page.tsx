"use client";

import { useState } from "react";
import { Save, UserCircle, Activity, HeartPulse, ClipboardList } from "lucide-react";
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
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card className="p-6">
          <PageHeader
            eyebrow="Settings"
            title="Athlete Profile & Context"
            description="Fine-tune your personal and biological data to improve plan accuracy and AI coaching depth."
            actions={
              <Button type="button" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>
            }
          />

          <div className="mt-8 space-y-8">
            {/* PERSONAL SECTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[color:var(--foreground)] opacity-80">
                <UserCircle className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Personal Identity</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Preferred Name</p>
                  <Input 
                    value={profile.nickname || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, nickname: e.target.value }))} 
                    placeholder="How should the coach call you?" 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Pronouns</p>
                  <Input 
                    value={profile.pronouns || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, pronouns: e.target.value }))} 
                    placeholder="e.g. he/him, they/them" 
                  />
                </div>
              </div>
            </section>

            {/* BIOLOGICAL SECTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[color:var(--foreground)] opacity-80">
                <HeartPulse className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Biological Baseline</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Age</p>
                  <Input 
                    type="number"
                    value={String(profile.age || "")} 
                    onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) || undefined }))} 
                    placeholder="Years" 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Weight (kg)</p>
                  <Input 
                    type="number"
                    value={String(profile.weight || "")} 
                    onChange={(e) => setProfile(p => ({ ...p, weight: parseFloat(e.target.value) || undefined }))} 
                    placeholder="kg" 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Height (cm)</p>
                  <Input 
                    type="number"
                    value={String(profile.height || "")} 
                    onChange={(e) => setProfile(p => ({ ...p, height: parseFloat(e.target.value) || undefined }))} 
                    placeholder="cm" 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Daily Sleep (Avg Hours)</p>
                  <Input 
                    type="number"
                    step="0.5"
                    value={String(profile.sleepHours || "")} 
                    onChange={(e) => setProfile(p => ({ ...p, sleepHours: parseFloat(e.target.value) || undefined }))} 
                    placeholder="Recovery metric" 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Non-Gym Activity Level</p>
                  <Select value={profile.activityLevel} onValueChange={(val) => setProfile(p => ({ ...p, activityLevel: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedentary">Sedentary (Desk Job)</SelectItem>
                      <SelectItem value="Light">Lightly Active</SelectItem>
                      <SelectItem value="Moderate">Moderately Active</SelectItem>
                      <SelectItem value="High">Highly Active (Physical Job)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* TRAINING SECTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[color:var(--foreground)] opacity-80">
                <Activity className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Training Parameters</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Primary Goal</p>
                  <Input value={profile.goal} onChange={(e) => setProfile(p => ({ ...p, goal: e.target.value }))} placeholder="Strength, Recomp, etc." />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Experience</p>
                  <Select value={profile.experienceLevel} onValueChange={(val) => setProfile(p => ({ ...p, experienceLevel: val }))}>
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Body Map Model</p>
                  <Select value={profile.bodyGender} onValueChange={(val) => setProfile(p => ({ ...p, bodyGender: val as "male" | "female" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male Model</SelectItem>
                      <SelectItem value="female">Female Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Weekly Session Target</p>
                  <Input 
                    type="number" 
                    min="1" 
                    max="7" 
                    value={String(profile.weeklySessions)} 
                    onChange={(e) => setProfile(p => ({ ...p, weeklySessions: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
              </div>
            </section>

            {/* MEDICAL SECTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[color:var(--foreground)] opacity-80">
                <ClipboardList className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Health & Safety</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Medical Conditions</p>
                  <Textarea 
                    value={profile.medicalConditions || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, medicalConditions: e.target.value }))} 
                    placeholder="Any conditions the coach should be aware of (e.g. Asthma, Hypertension)"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Active Injuries / Movement Restrictions</p>
                  <Textarea 
                    value={profile.injuries} 
                    onChange={(e) => setProfile(p => ({ ...p, injuries: e.target.value }))} 
                    placeholder="e.g. Rounded shoulders, tight lower back, knee pain when squatting"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)]">Additional Context</p>
                  <Textarea 
                    value={profile.notes} 
                    onChange={(e) => setProfile(p => ({ ...p, notes: e.target.value }))} 
                    placeholder="Nutrition habits, preferred lift styles, equipment access..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </section>
          </div>

          {status ? (
            <div className="mt-8">
              <Badge className="bg-[color:var(--support)] text-white! border-none py-2 px-4 shadow-md animate-in fade-in slide-in-from-bottom-2">
                {status}
              </Badge>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6 h-fit sticky top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Account Status
          </p>
          <CardTitle className="mt-2">{data.user.name}</CardTitle>
          <CardDescription className="mt-1">{data.user.email}</CardDescription>

          <div className="mt-8 space-y-4">
            {[
              ["BMI (Estimated)", profile.weight && profile.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "N/A"],
              ["Total Plans", String(data.plans.length)],
              ["Logged Sessions", String(data.sessions.length)],
              ["Recorded PRs", String(data.records.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-[color:var(--border)] bg-black/[0.02] p-5 transition hover:bg-white/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">{label}</p>
                <p className="mt-2 font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[color:var(--brand)] p-6 text-white! shadow-xl shadow-[color:var(--brand)]/20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Coach Insight</p>
            <p className="mt-4 text-sm font-medium leading-7">
              {profile.nickname ? `Stay sharp, ${profile.nickname}. ` : "Stay sharp. "}
              The data above helps me engineer better protocols for your specific biological baseline. Keep your weight and injury logs current for maximum safety.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
