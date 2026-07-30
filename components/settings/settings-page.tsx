"use client";

import { useEffect, useState } from "react";
import { Save, UserCircle, Activity, HeartPulse, Key, Settings, Sparkles, Trophy, CalendarCheck, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/components/shared/data-provider";
import { cn } from "@/lib/utils";

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

  // Appearance Theme state
  const [activeTheme, setActiveTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("kratos_theme") || "theme-light" : "theme-light"
  );

  const changeTheme = (newTheme: string) => {
    setActiveTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("kratos_theme", newTheme);
    }
  };

  useEffect(() => {
    document.documentElement.className = activeTheme === "theme-dark" ? "theme-dark" : "";
  }, [activeTheme]);

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
    <div className="grid gap-3 pb-14 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6 xl:pb-0 items-start">
      
      {/* LEFT COLUMN: Tabbed Config panels */}
      <div className="space-y-3 xl:space-y-6">
        <Card className="rounded-xl border-transparent bg-card/80 p-3 shadow-[0_15px_50px_rgba(0,0,0,0.05)] backdrop-blur md:rounded-[32px] md:p-8">
          <div className="hidden items-center gap-2 mb-3 sm:flex">
            <span className="p-2 bg-foreground/5 text-foreground rounded-xl">
              <Settings className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40">Settings</span>
          </div>

          <PageHeader
            eyebrow="Settings"
            title="Profile & Coach"
            description="Keep the essentials current."
            actions={
              <Button type="button" onClick={save} disabled={saving} className="h-9 w-full px-3 bg-brand hover:bg-brand/90 text-background font-semibold text-xs rounded-xl shadow-md border-none flex items-center gap-2 transition duration-200 sm:h-12 sm:w-auto sm:px-5">
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </Button>
            }
          />

          {/* Settings Tabs Navigator */}
          <Tabs defaultValue="identity" className="mt-3.5 flex flex-col space-y-3 md:mt-8 md:space-y-6">
            <TabsList className="grid w-full shrink-0 grid-cols-5 gap-1 bg-foreground/5 p-1 rounded-lg md:inline-flex md:w-fit md:flex-wrap md:gap-2 md:p-1.5 md:rounded-2xl">
              <TabsTrigger value="identity" className="h-7 rounded-md px-2 py-0 text-[0] font-bold gap-0 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground sm:h-auto sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <UserCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="biological" className="h-7 rounded-md px-2 py-0 text-[0] font-bold gap-0 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground sm:h-auto sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <HeartPulse className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Body</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="h-7 rounded-md px-2 py-0 text-[0] font-bold gap-0 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground sm:h-auto sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Training</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="h-7 rounded-md px-2 py-0 text-[0] font-bold gap-0 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground sm:h-auto sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="credentials" className="h-7 rounded-md px-2 py-0 text-[0] font-bold gap-0 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground sm:h-auto sm:text-xs sm:gap-1.5 md:px-4 md:py-2.5 md:rounded-xl">
                <Key className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="identity" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Nickname</label>
                    <Input 
                      value={profile.nickname || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, nickname: e.target.value }))} 
                      placeholder="How should the coach call you?" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Pronouns</label>
                    <Input 
                      value={profile.pronouns || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, pronouns: e.target.value }))} 
                      placeholder="e.g. he/him, they/them" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Medical notes</label>
                  <Textarea 
                    value={profile.medicalConditions || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, medicalConditions: e.target.value }))} 
                    placeholder="Any conditions the coach should be aware of (e.g. Asthma, Hypertension)..."
                    className="bg-card border-border focus:border-black rounded-lg min-h-[64px] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Injuries</label>
                  <Textarea 
                    value={profile.injuries || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, injuries: e.target.value }))} 
                    placeholder="e.g. Rounded shoulders, tight lower back, knee discomfort when squatting..."
                    className="bg-card border-border focus:border-black rounded-lg min-h-[64px] text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* BIOLOGICAL TAB */}
            <TabsContent value="biological" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Age</label>
                    <Input 
                      type="number"
                      value={String(profile.age || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) || undefined }))} 
                      placeholder="Years" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Weight (kg)</label>
                    <Input 
                      type="number"
                      value={String(profile.weight || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, weight: parseFloat(e.target.value) || undefined }))} 
                      placeholder="kg" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Height (cm)</label>
                    <Input 
                      type="number"
                      value={String(profile.height || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, height: parseFloat(e.target.value) || undefined }))} 
                      placeholder="cm" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Sleep</label>
                    <Input 
                      type="number"
                      step="0.5"
                      value={String(profile.sleepHours || "")} 
                      onChange={(e) => setProfile(p => ({ ...p, sleepHours: parseFloat(e.target.value) || undefined }))} 
                      placeholder="Recovery baseline hours" 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Activity</label>
                    <Select value={profile.activityLevel} onValueChange={(val) => setProfile(p => ({ ...p, activityLevel: val }))}>
                      <SelectTrigger className="bg-card border-border rounded-lg h-9 text-xs font-semibold">
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Goal</label>
                    <Input value={profile.goal} onChange={(e) => setProfile(p => ({ ...p, goal: e.target.value }))} placeholder="Strength, Powerlifting, Muscle Build..." className="bg-card border-border focus:border-black rounded-lg h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Experience</label>
                    <Select value={profile.experienceLevel} onValueChange={(val) => setProfile(p => ({ ...p, experienceLevel: val }))}>
                      <SelectTrigger className="bg-card border-border rounded-lg h-9 text-xs font-semibold">
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Body map</label>
                    <Select value={profile.bodyGender} onValueChange={(val) => setProfile(p => ({ ...p, bodyGender: val as "male" | "female" }))}>
                      <SelectTrigger className="bg-card border-border rounded-lg h-9 text-xs font-semibold">
                        <SelectValue placeholder="Gender model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male Model</SelectItem>
                        <SelectItem value="female">Female Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Sessions/week</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="7" 
                      value={String(profile.weeklySessions)} 
                      onChange={(e) => setProfile(p => ({ ...p, weeklySessions: parseInt(e.target.value) || 0 }))} 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Notes</label>
                  <Textarea 
                    value={profile.notes || ""} 
                    onChange={(e) => setProfile(p => ({ ...p, notes: e.target.value }))} 
                    placeholder="Nutrition parameters, seating heights, preferred progression strategies..."
                    className="bg-card border-border focus:border-black rounded-lg min-h-[64px] text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            {/* CREDENTIALS TAB */}
            <TabsContent value="credentials" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="p-4 border border-border bg-card/65/50 rounded-2xl space-y-4 md:p-5">
                <div className="flex items-center gap-2 text-foreground">
                  <Key className="h-4.5 w-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Gemini API Key</h3>
                </div>
                <p className="hidden text-[11px] text-foreground/60 leading-relaxed sm:block">
                  Provide your personal Google Gemini API key. This key resides strictly in your browser's local sandbox storage and is forwarded directly to the chat API requests.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Gemini API Key</label>
                    <Input 
                      type="password"
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)} 
                      placeholder="AIzaSy..." 
                      className="bg-card border-border focus:border-black rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/50 block">Active AI Model</label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                      <SelectTrigger className="bg-card border-border rounded-lg h-9 text-xs font-semibold">
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

            {/* APPEARANCE TAB */}
            <TabsContent value="appearance" className="mt-0 outline-none space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Palette className="h-4.5 w-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Appearance Theme</h3>
                </div>
                <p className="hidden text-[11px] text-foreground/60 leading-relaxed sm:block">
                  Personalize your training sandbox with premium visual presets. Theme adjustments apply instantly across all layouts and workspace views.
                </p>

                <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    {
                      id: "theme-light",
                      name: "Light Mode",
                      description: "Clean paper white background with dark charcoal borders and details.",
                      bgClass: "bg-card",
                      cardClass: "bg-[#f5f5f7]",
                      brandClass: "bg-brand",
                      vibe: "Stark Clean"
                    },
                    {
                      id: "theme-dark",
                      name: "Dark Mode",
                      description: "Deep pitch black canvas with carbon cards and crisp white accents.",
                      bgClass: "bg-brand",
                      cardClass: "bg-[#18181b]",
                      brandClass: "bg-card",
                      vibe: "Stark Dark"
                    }
                  ].map((themeOpt) => {
                    const isSelected = activeTheme === themeOpt.id;
                    return (
                      <button
                        type="button"
                        key={themeOpt.id}
                        onClick={() => changeTheme(themeOpt.id)}
                        className={cn(
                          "flex flex-col text-left rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer active:scale-[0.98] select-none hover:shadow-md",
                          isSelected
                            ? "border-brand bg-card shadow-sm ring-1 ring-brand"
                            : "border-border bg-card/45 hover:border-border-strong"
                        )}
                      >
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-foreground">{themeOpt.name}</span>
                           <span className="text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground">{themeOpt.vibe}</span>
                         </div>
                         <p className="text-[10px] text-muted-foreground leading-relaxed mt-2.5 min-h-[32px]">{themeOpt.description}</p>
                         
                         {/* Swatch palette */}
                         <div className="mt-4 flex items-center gap-1.5 p-2 rounded-xl bg-foreground/[0.02] border border-border">
                           <div className={cn("h-4.5 w-4.5 rounded-full border border-border shadow-inner shrink-0", themeOpt.bgClass)} title="Background" />
                           <div className={cn("h-4.5 w-4.5 rounded-full border border-border shadow-sm shrink-0", themeOpt.cardClass)} title="Card" />
                           <div className={cn("h-4.5 w-4.5 rounded-full border border-border shadow-sm shrink-0", themeOpt.brandClass)} title="Accent" />
                           <div className="ml-auto flex items-center">
                             {isSelected ? (
                               <div className="h-4.5 w-4.5 rounded-full bg-brand text-background flex items-center justify-center shrink-0">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                 </svg>
                               </div>
                             ) : (
                               <div className="h-4.5 w-4.5 rounded-full border border-dashed border-border-strong shrink-0" />
                             )}
                           </div>
                         </div>
                       </button>
                     );
                   })}
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
        <Card className="p-6 md:p-8 border-transparent bg-card/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px] sticky top-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40 block">
            Athlete summary
          </span>
          <CardTitle className="mt-2 text-2xl font-bold text-foreground">{data.user.name}</CardTitle>
          <CardDescription className="text-xs text-foreground/50 mt-1">{data.user.email}</CardDescription>

          <div className="mt-6 space-y-3.5">
            {[
              { label: "BMI (Estimated)", value: profile.weight && profile.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "N/A", icon: HeartPulse, colorClass: "text-neutral-700 bg-card/85" },
              { label: "Programmed Splits", value: String(data.plans.length), icon: CalendarCheck, colorClass: "text-neutral-700 bg-card/85" },
              { label: "Logged Sessions", value: String(data.sessions.length), icon: Activity, colorClass: "text-neutral-700 bg-card/85" },
              { label: "Recorded PRs", value: String(data.records.length), icon: Trophy, colorClass: "text-neutral-700 bg-card/85" },
            ].map(({ label, value, icon: Icon, colorClass }) => (
              <div key={label} className="rounded-2xl border border-border bg-card/45 p-4 flex items-center gap-4 hover:border-border-strong transition">
                <div className={`p-2.5 rounded-xl ${colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-foreground/40">{label}</p>
                  <p className="mt-0.5 text-lg font-bold text-foreground leading-none">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-brand p-5 text-background shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15">
              <Sparkles className="h-10 w-10 text-background" />
            </div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Coach alignment</p>
            <p className="mt-3 text-xs leading-relaxed text-background/80">
              {profile.nickname ? `Stay sharp, ${profile.nickname}. ` : "Stay sharp. "}
              Your saved context helps the coach tailor advice.
            </p>
          </div>
        </Card>
      </div>

    </div>
  );
}
