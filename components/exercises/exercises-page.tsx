"use client";

import { useMemo, useState } from "react";
import type { ExerciseCategory, BodyHighlightSlug } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData } from "@/components/shared/data-provider";
import { Search, Compass, BookOpen, Clock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const categories: Array<ExerciseCategory | "All"> = ["All", "Push", "Pull", "Legs", "Core", "Conditioning", "Mobility"];

export function ExercisesPage() {
  const data = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "All">("All");
  const [selectedId, setSelectedId] = useState(data.exercises[0]?.id ?? "");

  const filtered = useMemo(
    () =>
      data.exercises.filter((exercise) => {
        const matchesCategory = category === "All" || exercise.category === category;
        const haystack = `${exercise.name} ${exercise.primaryMuscles.join(" ")} ${exercise.secondaryMuscles.join(" ")}`.toLowerCase();
        return matchesCategory && haystack.includes(query.toLowerCase());
      }),
    [category, data.exercises, query]
  );

  const selected = filtered.find((exercise) => exercise.id === selectedId) ?? filtered[0] ?? data.exercises[0];

  const exerciseIntensities = useMemo(() => {
    if (!selected) return [];
    const intensities: Array<{ slug: BodyHighlightSlug; intensity: number }> = [];
    
    selected.bodyRegionSlugs.forEach((slug, idx) => {
      intensities.push({ 
        slug, 
        intensity: idx < 2 ? 4 : 2 
      });
    });
    
    return intensities;
  }, [selected]);

  return (
    <div className="space-y-6">
      
      {/* Visual Library Header */}
      <div className="rounded-[36px] bg-gradient-to-r from-neutral-900 to-black p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 space-y-2">
          <Badge className="bg-white/10 border-transparent text-white font-bold uppercase tracking-widest text-[9px] px-3 py-1">
            Exercise Encyclopedia
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Movement Intelligence Catalog
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-xl font-medium leading-relaxed">
            Audit anatomical target activation zones, filter standard training patterns, and review specific seat setup details.
          </p>
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] items-start">
        
        {/* LEFT COLUMN: Search & scrolling movements list */}
        <Card className="flex flex-col p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px] min-h-[75vh]">
          
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Compass className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Biomechanics Index</span>
          </div>

          <PageHeader
            eyebrow="Atlas"
            title="Browse Movements"
            description="Locate muscle categories or filter specific equipment profiles."
          />

          {/* Search bar with prefix icon */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by exercise name, target muscle..."
              className="pl-11 bg-white border-black/5 focus:border-black rounded-2xl py-4.5 px-4.5 text-sm font-semibold transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 pb-3 border-b border-black/5">
            {categories.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setCategory(entry)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition duration-300",
                  category === entry
                    ? "bg-black text-white shadow-sm"
                    : "border border-black/5 bg-white/40 text-black/60 hover:bg-white hover:text-black"
                )}
              >
                {entry}
              </button>
            ))}
          </div>

          {/* Catalog count indicators */}
          <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-wider text-black/45">
            <span>Movements Catalog</span>
            <Badge className="bg-black/5 border-transparent text-black/60 text-[9px] font-extrabold">{filtered.length} targets</Badge>
          </div>

          {/* Movement List items */}
          <ScrollArea className="mt-4 flex-1 -mr-2 pr-2 h-[400px]">
            <div className="space-y-2 pb-6">
              {filtered.map((exercise) => {
                const isChosen = exercise.id === selected?.id;
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => setSelectedId(exercise.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition duration-300 relative group overflow-hidden",
                      isChosen
                        ? "border-black/20 bg-black/5 shadow-sm"
                        : "border-black/5 bg-white/40 hover:bg-white/80"
                    )}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="font-bold text-sm text-black leading-snug">{exercise.name}</p>
                        <p className="mt-1.5 text-[10px] text-black/40 font-bold uppercase tracking-wider">{exercise.equipment}</p>
                      </div>
                      <Badge className="bg-black/5 border-transparent text-black/60 text-[9px] font-bold px-2 py-0.5 uppercase">
                        {exercise.category}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* RIGHT COLUMN: Biomechanics Inspector Map & Setup */}
        {selected ? (
          <div className="space-y-6">
            
            <MuscleMap 
              intensities={exerciseIntensities} 
              profile={data.profile} 
              title={`${selected.name} Target Tissue Activation`} 
            />

            <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] rounded-[32px] space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight">{selected.name}</h3>
                  <p className="text-xs text-black/45 mt-1 leading-none font-medium">
                    {selected.category} • {selected.equipment} • {selected.defaultRestSeconds}s standard rest
                  </p>
                </div>

                {selected.videoUrl && (
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-black/5 hover:bg-black/5 hover:text-black font-semibold text-xs flex gap-1.5 items-center">
                    <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="h-4 w-4" />
                      <span>Watch pattern demo</span>
                    </a>
                  </Button>
                )}
              </div>

              {selected.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02]">
                  <img
                    src={selected.imageUrl}
                    alt={selected.name}
                    className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>
              )}

              {/* Target muscle details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border border-black/5 bg-white/45 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">
                    Primary Mover Tissue
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {selected.primaryMuscles.map((muscle) => (
                      <Badge key={muscle} className="bg-emerald-500/10 border-transparent text-emerald-700 text-[10px] font-bold px-2 py-0.5">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border border-black/5 bg-white/45 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">
                    Supporting Helper Tissue
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {selected.secondaryMuscles.map((muscle) => (
                      <Badge key={muscle} className="bg-indigo-500/10 border-transparent text-indigo-700 text-[10px] font-bold px-2 py-0.5">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setup list instructions */}
              <div className="p-5 border border-black/5 bg-white/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-black/5 pb-2 text-black/50">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Setup & Execution Guidelines</span>
                </div>
                <ol className="list-decimal mt-4 space-y-3.5 pl-4 text-xs leading-relaxed text-black/70">
                  {selected.instructions.map((instruction) => (
                    <li key={instruction} className="pl-1">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

            </Card>

          </div>
        ) : null}
      </div>

    </div>
  );
}
