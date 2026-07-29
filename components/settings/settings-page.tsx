"use client";

import { useState } from "react";
import { Save, UserCircle, Activity, HeartPulse, Key, Settings, Sparkles, Trophy, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/components/shared/data-provider";

export function SettingsPage() {
  const data = useData();
  const router = useRouter();
  const [profile, setProfile] = useState(data.profile);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Client storage credentials
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("kratos_gemini_api_key") || "" : ""
  );
  const [aiModel, setAiModel] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("kratos_gemini_model") || "gemini-2.5-flash" : "gemini-2.5-flash"
  );

  const save = async () => {
    setSaving(true);
    setStatus("");

    // biological profile updates
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

    // credentials localstorage updates
    if (typeof window !== "undefined") {
      localStorage.setItem("kratos_gemini_api_key", apiKey.trim());
      localStorage.setItem("kratos_gemini_model", aiModel);
    }

    setStatus("Settings saved.");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6 items-start">
      
      {/* LEFT COLUMN: Tabbed Config panels */}
      <div className="space-y-4 xl:space-y-6">
        <Card className="p-4 md:p-8 border-transparent bg-white/80 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-2xl md:rounded-[32px]">
          <div className="hidden items-center gap-2 mb-3 sm:flex">
            <span className="p-2 bg-black/5 text-black rounded-xl">
              <Settings className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">Settings</span>
          </div>

          <PageHeader
            eyebrow="Settings"
            title="Profile & Coach"
            description="Keep the essentials current."
            actions={
              <Button type="button" onClick={save} disabled={saving} className="h-10 w-full px-4 bg-black hover:bg-black/90 text-white font-semibold text-xs rounded-xl shadow-md border-none flex items-center gap-2 transition duration-200 sm:h-12 sm:w-auto sm:px-5">
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </Button>
            }
          />

          {/* Settings Tabs Navigator */}
          <Tabs defaultValue="identity" className="mt-5 flex flex-col space-y-4 md:mt-8 md:space-y-6">
            <TabsList className="grid w-full shrink-0 grid-cols-4 gap-1 bg-black/5 p-1 rounded-xl md:inline-flex md:w-fit md:flex-wrap md:gap-2 md:p-1.5 md:rounded-2xl">
              <TabsTrigger value="identity" className="px-2 py-2 text-[0] font-bold rounded-lg gap-0 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <UserCircle className="h-3.5 w-3.5" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="biological" className="px-2 py-2 text-[0] font-bold rounded-lg gap-0 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Body</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="px-2 py-2 text-[0] font-bold rounded-lg gap-0 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <Activity className="h-3.5 w-3.5" />
                <span>Training</span>
              </TabsTrigger>
              <TabsTrigger value="credentials" className="px-2 py-2 text-[0] font-bold rounded-lg gap-0 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <Key className="h-3.5 w-3.5" />
                <span>API</span>
              </TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="identity" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Nickname</label>
                    <Input 
                      value={profile.nickname || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, nickname: e.target.value }))} 
                      placeholder="How should the coach call you?" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Pronouns</label>
                    <Input 
                      value={profile.pronouns || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, pronouns: e.target.value }))} 
                      placeholder="e.g. he/him, they/them" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Medical notes</label>
                  <Textarea 
                    value={profile.medicalConditions || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, medicalConditions: e.target.value }))} 
                    placeholder="Any conditions the coach should be aware of (e.g. Asthma, Hypertension)..."
                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px] py-3 px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Injuries</label>
                  <Textarea 
                    value={profile.injuries || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, injuries: e.target.value }))} 
                    placeholder="e.g. Rounded shoulders, tight lower back, knee discomfort when squatting..."
                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px] py-3 px-4"
                  />
                </div>
              </div>
            </TabsContent>

            {/* BIOLOGICAL TAB */}
            <TabsContent value="biological" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Age</label>
                    <Input 
                      type="number"
                      value={String(profile.age || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) || undefined }))} 
                      placeholder="Years" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Weight (kg)</label>
                    <Input 
                      type="number"
                      value={String(profile.weight || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, weight: parseFloat(e.target.value) || undefined }))} 
                      placeholder="kg" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Height (cm)</label>
                    <Input 
                      type="number"
                      value={String(profile.height || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, height: parseFloat(e.target.value) || undefined }))} 
                      placeholder="cm" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Sleep</label>
                    <Input 
                      type="number"
                      step="0.5"
                      value={String(profile.sleepHours || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, sleepHours: parseFloat(e.target.value) || undefined }))} 
                      placeholder="Recovery baseline hours" 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Activity</label>
                    <Select value={profile.activityLevel} onValueChange={(val) => setProfile(p => ({ ...p, activityLevel: val }))}>
                      <SelectTrigger className="bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                        <SelectValue placeholder="Select activity level" />
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
              </div>
            </TabsContent>

            {/* GYM TARGETS TAB */}
            <TabsContent value="training" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Goal</label>
                    <Input value={profile.goal} onChange={(e) => setProfile(p => ({ ...p, goal: e.target.value }))} placeholder="Strength, Powerlifting, Muscle Build..." className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Experience</label>
                    <Select value={profile.experienceLevel} onValueChange={(val) => setProfile(p => ({ ...p, experienceLevel: val }))}>
                      <SelectTrigger className="bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                        <SelectValue placeholder="Experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Body map</label>
                    <Select value={profile.bodyGender} onValueChange={(val) => setProfile(p => ({ ...p, bodyGender: val as "male" | "female" }))}>
                      <SelectTrigger className="bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                        <SelectValue placeholder="Gender model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male Model</SelectItem>
                        <SelectItem value="female">Female Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Sessions/week</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="7" 
                      value={String(profile.weeklySessions)} 
                      onChange={(e) => setProfile(p => ({ ...p, weeklySessions: parseInt(e.target.value) || 0 }))} 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Notes</label>
                  <Textarea 
                    value={profile.notes || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, notes: e.target.value }))} 
                    placeholder="Nutrition parameters, seating heights, preferred progression strategies..."
                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px] py-3 px-4"
                  />
                </div>
              </div>
            </TabsContent>

            {/* CREDENTIALS TAB */}
            <TabsContent value="credentials" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="p-4 border border-black/5 bg-neutral-50/50 rounded-2xl space-y-4 md:p-5">
                <div className="flex items-center gap-2 text-neutral-800">
                  <Key className="h-4.5 w-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Gemini API Key</h3>
                </div>
                <p className="hidden text-[11px] text-black/60 leading-relaxed sm:block">
                  Provide your personal Google Gemini API key. This key resides strictly in your browser's local sandbox storage and is forwarded directly to the chat API requests.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Gemini API Key</label>
                    <Input 
                      type="password"
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)} 
                      placeholder="AIzaSy..." 
                      className="bg-white border-black/5 focus:border-black rounded-xl py-3.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Active AI Model</label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                      <SelectTrigger className="bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Deep reasoning)</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast response)</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {status ? (
            <div className="mt-8 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 text-xs font-semibold text-center">
              {status}
            </div>
          ) : null}
        </Card>
      </div>

      {/* RIGHT COLUMN: Athlete Context Dashboard */}
      <div className="hidden space-y-6 xl:block">
        <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px] sticky top-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/40 block">
            Athlete summary
          </span>
          <CardTitle className="mt-2 text-2xl font-bold text-black">{data.user.name}</CardTitle>
          <CardDescription className="text-xs text-black/50 mt-1">{data.user.email}</CardDescription>

          <div className="mt-6 space-y-3.5">
            {[
              { label: "BMI (Estimated)", value: profile.weight && profile.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "N/A", icon: HeartPulse, colorClass: "text-neutral-700 bg-neutral-100" },
              { label: "Programmed Splits", value: String(data.plans.length), icon: CalendarCheck, colorClass: "text-neutral-700 bg-neutral-100" },
              { label: "Logged Sessions", value: String(data.sessions.length), icon: Activity, colorClass: "text-neutral-700 bg-neutral-100" },
              { label: "Recorded PRs", value: String(data.records.length), icon: Trophy, colorClass: "text-neutral-700 bg-neutral-100" },
            ].map(({ label, value, icon: Icon, colorClass }) => (
              <div key={label} className="rounded-2xl border border-black/5 bg-white/45 p-4 flex items-center gap-4 hover:border-black/10 transition">
                <div className={`p-2.5 rounded-xl ${colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">{label}</p>
                  <p className="mt-0.5 text-lg font-bold text-black leading-none">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-black p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Coach alignment</p>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              {profile.nickname ? `Stay sharp, ${profile.nickname}. ` : "Stay sharp. "}
              Your saved context helps the coach tailor advice.
            </p>
          </div>
        </Card>
      </div>

    </div>
  );
}
