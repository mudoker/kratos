"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { SendHorizonal, Bot, Settings, ShieldAlert, Sparkles, Key, Check, Info, Loader2 } from "lucide-react";
import type { CoachMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/components/shared/data-provider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function CoachPage() {
  const data = useData();
  const [messages, setMessages] = useState<CoachMessage[]>(data.coachMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // API Config State
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load key & model on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("kratos_gemini_api_key") || "";
      const storedModel = localStorage.getItem("kratos_gemini_model") || "gemini-2.5-flash";
      setApiKey(storedKey);
      setAiModel(storedModel);
      setHasApiKey(storedKey.trim().length > 0);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollArea = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, pending]);

  const recentSessions = useMemo(() => data.sessions.slice(0, 5), [data.sessions]);

  const saveConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kratos_gemini_api_key", apiKey.trim());
      localStorage.setItem("kratos_gemini_model", aiModel);
      setHasApiKey(apiKey.trim().length > 0);
    }
    setShowConfigModal(false);
    setError("");
  };

  const send = async () => {
    if (!input.trim() || pending) return;

    if (!hasApiKey) {
      setShowConfigModal(true);
      return;
    }

    setPending(true);
    setError("");
    const message = input.trim();
    setInput("");

    // optimistic update
    const optimisticMessage: CoachMessage = { 
      id: `draft-msg-${Date.now()}`,
      userId: data.user.id,
      role: "user", 
      content: message,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-key": apiKey.trim(),
          "x-gemini-model": aiModel,
        },
        body: JSON.stringify({ message }),
      });

      const payload = (await response.json()) as { message?: string; messages?: CoachMessage[]; error?: string };
      if (!response.ok || !payload.messages) {
        throw new Error(payload.error || "Failed to get a response from the coach.");
      }

      setMessages(payload.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a response from the coach.");
      // Remove optimistic message or keep it and restore input
      setInput(message);
      setMessages((prev) => prev.slice(0, -1)); // revert last optimism
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-3 pb-14 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6 xl:pb-0 items-start">
      
      {/* LEFT COLUMN: Chat Interface */}
      <Card className="flex h-[calc(100dvh-112px)] min-h-[390px] flex-col rounded-xl border-transparent bg-white/80 p-3 shadow-[0_15px_50px_rgba(0,0,0,0.05)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-8 lg:h-[780px]">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-2.5 sm:pb-5">
          <div className="space-y-1">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">Coach</span>
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-black sm:mt-2 sm:text-2xl">Kratos Coach</h2>
          </div>

          {/* Model selection & settings button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black/5 border border-black/5 rounded-xl text-[10px] font-bold text-black/60 uppercase">
              <Sparkles className="h-3 w-3 text-neutral-500" />
              <span>Model: {aiModel}</span>
            </div>
            <Button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-black/5 p-0 text-black/60 shadow-sm transition hover:bg-black/10 sm:h-11 sm:w-11 sm:rounded-xl"
              title="Configure Coach API"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages view thread */}
        <div className="flex-1 min-h-0 relative">
          <ScrollArea ref={scrollContainerRef} className="mt-2.5 h-full w-full pr-1 sm:mt-4 sm:pr-2">
            <div className="space-y-3 pb-4 sm:space-y-5 sm:pb-8">
              {messages.length ? (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex gap-2.5 sm:gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-black text-white shadow-sm mt-1 sm:h-9 sm:w-9 sm:rounded-xl">
                          <Bot className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap sm:max-w-[80%] sm:rounded-[24px] sm:px-5 sm:py-4 ${
                          isUser
                            ? "bg-black text-white rounded-tr-none font-medium"
                            : "border border-black/5 bg-white/60 text-black rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="mx-auto flex max-w-[260px] flex-col items-center justify-center py-8 text-center sm:max-w-sm sm:py-20">
                  <div className="mb-2.5 rounded-xl bg-black/5 p-2.5 text-black sm:mb-4 sm:p-4 sm:rounded-2xl">
                    <Bot className="h-5 w-5 sm:h-8 sm:w-8" />
                  </div>
                  <h4 className="text-xs font-semibold text-black sm:text-sm">Start your coaching thread</h4>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-black/50 sm:mt-2 sm:text-xs">
                    Ask about your plan, load choices, or recent session.
                  </p>
                  {!hasApiKey && (
                    <Button onClick={() => setShowConfigModal(true)} className="mt-4 h-8 rounded-lg border-none bg-black px-3 text-[11px] font-semibold text-white shadow-md hover:bg-black/90 sm:h-11 sm:rounded-xl sm:px-5 sm:text-xs">
                      Configure key
                    </Button>
                  )}
                </div>
              )}

              {pending && (
                <div className="flex gap-3.5 justify-start">
                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-black text-white shadow-sm">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="max-w-[80%] rounded-[24px] px-5 py-4 border border-black/5 bg-white/40 text-black rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-black/40" />
                    <span className="text-xs font-medium text-black/40">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Text Box area */}
        <div className="mt-2 border-t border-black/5 pt-2.5 sm:pt-4">
          <div className="relative flex items-end rounded-xl border border-black/5 bg-black/5 p-1.5 transition duration-300 focus-within:border-black/20 focus-within:bg-white sm:rounded-2xl sm:p-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={hasApiKey ? "Ask the coach..." : "Configure API key first..."}
              className="min-h-[38px] max-h-[90px] resize-none border-none bg-transparent py-1.5 pr-10 text-xs text-black placeholder-black/30 focus-visible:ring-0 focus-visible:ring-offset-0 sm:min-h-[46px] sm:max-h-[110px] sm:pr-12"
              disabled={!hasApiKey || pending}
            />
            <Button 
              type="button" 
              onClick={send} 
              disabled={pending || !input.trim() || !hasApiKey}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-black p-0 text-white shadow-sm transition hover:bg-black/90 disabled:opacity-30 sm:bottom-3 sm:right-3 sm:h-9 sm:w-9 sm:rounded-xl"
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <p className="mt-2.5 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </Card>

      {/* RIGHT COLUMN: Sidebar Stats & Context */}
      <div className="hidden space-y-6 xl:block">
        
        {/* API Credentials Warning banner (if missing) */}
        {!hasApiKey && (
          <Card className="p-6 border border-black/5 bg-neutral-50/50 text-neutral-800 rounded-[32px] flex gap-4">
            <div className="p-2 bg-neutral-100 rounded-xl text-neutral-600 h-fit">
              <Key className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wide">API key required</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Add a Gemini key to chat with the coach.
              </p>
              <Button onClick={() => setShowConfigModal(true)} className="h-10 px-4 rounded-xl text-xs font-semibold bg-black hover:bg-neutral-900 text-white transition border-none shadow-sm mt-1">
                Configure Credentials
              </Button>
            </div>
          </Card>
        )}

        {/* Recent context panel */}
        <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px]">
          <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-neutral-600" />
            <span>Recent context</span>
          </CardTitle>
          <p className="mt-2 text-xs leading-relaxed text-black/50">
            The coach uses your profile, plans, and workout logs.
          </p>

          <div className="mt-5 space-y-3">
            {recentSessions.length ? (
              recentSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-black/5 bg-white/40 p-4 hover:border-black/10 transition">
                  <p className="text-xs font-bold text-black leading-tight">{session.title}</p>
                  <p className="mt-1 text-[10px] text-black/40 font-semibold">
                    {new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-black/30 border border-dashed border-black/10 rounded-xl">
                <p className="text-xs">No recent sessions found.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Athlete stats box */}
        <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px]">
          <CardTitle className="text-lg font-bold text-black">Profile baselines</CardTitle>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {[
              ["Experience", data.profile.experienceLevel],
              ["Sessions/Wk Target", String(data.profile.weeklySessions)],
              ["PR Checkpoints", String(data.records.length)],
              ["Core Target Goal", data.profile.goal || "Strength Build"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-black/5 pb-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold text-black">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* API Key configuration Dialog modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="rounded-[32px] p-6 max-w-md bg-white border border-black/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-black animate-spin-slow" />
              <span>Configure AI Coach credentials</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-black/50 mt-1 leading-relaxed">
              Enter your Google Gemini API Key and preferred model. These credentials are saved purely inside your browser's local sandbox storage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">Gemini API Key</label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-black/5 border-black/5 rounded-xl py-3 text-sm focus:border-black/20 focus:bg-white"
              />
              <p className="text-[10px] text-black/40 leading-relaxed">
                Need a key? Acquire one free from the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-black">Google AI Studio</a>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 block">AI Intelligence Model</label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="bg-black/5 border-black/5 rounded-xl py-3 text-sm">
                  <SelectValue placeholder="Choose a model" />
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

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-black/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowConfigModal(false)}
              className="h-11 rounded-xl px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveConfig}
              className="h-11 rounded-xl bg-black text-white hover:bg-black/90 px-5 text-xs font-semibold shadow-md flex gap-1.5 items-center border-none"
            >
              <Check className="h-4 w-4" />
              <span>Save Credentials</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
