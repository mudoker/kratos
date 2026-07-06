"use client";

import { useMemo, useState } from "react";
import type { ExerciseCategory, BodyHighlightSlug } from "@/lib/types";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/components/shared/data-provider";
import { Search, BookOpen, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const categories: Array<ExerciseCategory | "All"> = ["All", "Push", "Pull", "Legs", "Core", "Conditioning", "Mobility"];

export function ExercisesPage() {
  const data = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "All">("All");
  const [selectedId, setSelectedId] = useState(data.exercises[0]?.id ?? "");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;


  const filtered = useMemo(
    () =>
      data.exercises.filter((exercise) => {
        const matchesCategory = category === "All" || exercise.category === category;
        const haystack = `${exercise.name} ${exercise.primaryMuscles.join(" ")} ${exercise.secondaryMuscles.join(" ")}`.toLowerCase();
        return matchesCategory && haystack.includes(query.toLowerCase());
      }),
    [category, data.exercises, query]
  );

  // Reset page on filter change
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedExercises = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);


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

  // Reset page when filter changes
  const handleCategoryChange = (cat: ExerciseCategory | "All") => {
    setCategory(cat);
    setPage(0);
  };
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      
          <div className="rounded-[36px] bg-black p-5 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 space-y-1">
          <Badge className="bg-white/10 border-transparent text-white font-bold uppercase tracking-widest text-[9px] px-2 py-0.5">
            Exercise Encyclopedia
          </Badge>
          <h1 className="text-xl font-black tracking-tight leading-tight">
            Movement Library
          </h1>
          <p className="text-white/50 text-[11px] font-medium">
            Browse exercises, filter by category, inspect muscle activation.
          </p>
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] items-start">
        
        {/* LEFT COLUMN: Search & scrolling movements list */}
        <Card className="flex flex-col p-4 md:p-6 border-transparent bg-white/70 backdrop-blur shadow-sm rounded-[24px]">

          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">Browse</p>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30" />
            <Input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-white border-black/5 focus:border-black rounded-xl py-2 text-xs font-semibold transition h-9"
            />
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 pb-3 border-b border-black/5">
            {categories.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => handleCategoryChange(entry)}
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
          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-wider text-black/45">
            <span>{filtered.length} movements</span>
            <span className="text-black/30">{page + 1}/{pageCount || 1}</span>
          </div>

          {/* Movement List items - paginated */}
          <div className="mt-3 space-y-2">
            {paginatedExercises.map((exercise) => {
              const isChosen = exercise.id === selected?.id;
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => setSelectedId(exercise.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition duration-200 relative group",
                    isChosen
                      ? "border-black/20 bg-black/5 shadow-sm"
                      : "border-black/5 bg-white/40 hover:bg-white/80"
                  )}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-[11px] text-black leading-snug">{exercise.name}</p>
                      <p className="mt-0.5 text-[9px] text-black/40 font-bold uppercase tracking-wider">{exercise.equipment}</p>
                    </div>
                    <Badge className="bg-black/5 border-transparent text-black/60 text-[9px] font-bold px-2 py-0.5 uppercase shrink-0">
                      {exercise.category}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination controls */}
          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl px-3 py-1.5 text-[10px] font-bold border border-black/5 bg-white/40 hover:bg-white disabled:opacity-30 transition"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-black/40 font-semibold">{page + 1} of {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="rounded-xl px-3 py-1.5 text-[10px] font-bold border border-black/5 bg-white/40 hover:bg-white disabled:opacity-30 transition"
              >
                Next →
              </button>
            </div>
          )}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 border border-black/5 bg-white/45 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40 mb-2">
                    Primary
                  </p>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                    {selected.primaryMuscles.slice(0, 6).map((muscle) => (
                      <Badge key={muscle} className="bg-black/8 border-transparent text-black/70 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        {muscle}
                      </Badge>
                    ))}
                    {selected.primaryMuscles.length > 6 && (
                      <Badge className="bg-black/5 border-transparent text-black/40 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        +{selected.primaryMuscles.length - 6}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-3 border border-black/5 bg-white/45 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40 mb-2">
                    Secondary
                  </p>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                    {selected.secondaryMuscles.slice(0, 6).map((muscle) => (
                      <Badge key={muscle} className="bg-black/5 border-transparent text-black/50 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        {muscle}
                      </Badge>
                    ))}
                    {selected.secondaryMuscles.length > 6 && (
                      <Badge className="bg-black/5 border-transparent text-black/30 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        +{selected.secondaryMuscles.length - 6}
                      </Badge>
                    )}
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
