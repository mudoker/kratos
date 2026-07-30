"use client";

import { useMemo, useState } from "react";
import type { ExerciseCategory, BodyHighlightSlug } from "@/lib/types";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Card } from "@/components/ui/card";
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
  const PAGE_SIZE = 6;


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
    <div className="min-w-0 space-y-3 pb-14 lg:space-y-6 lg:pb-0">
      
      <div className="relative overflow-hidden rounded-xl bg-black p-3 text-white shadow-lg md:rounded-[36px] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 space-y-1">
          <Badge className="hidden bg-card/10 border-transparent text-white font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 sm:inline-flex">
            Exercise Encyclopedia
          </Badge>
          <h1 className="text-base font-semibold tracking-tight leading-tight sm:text-xl sm:font-black">
            Movement Library
          </h1>
          <p className="text-[10.5px] font-medium leading-snug text-white/50 sm:text-[11px]">
            Search movements and check setup cues.
          </p>
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[0.95fr_1.05fr] xl:gap-6">
        
        {/* LEFT COLUMN: Search & scrolling movements list */}
        <Card className="flex min-w-0 flex-col rounded-xl border-transparent bg-card/70 p-3 shadow-sm backdrop-blur md:rounded-[24px] md:p-6">

          <p className="hidden text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-3 sm:block">Browse</p>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
            <Input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-card border-border focus:border-black rounded-xl py-2 text-xs font-semibold transition h-9"
            />
          </div>

          {/* Filter Pills */}
          <div className="mt-2.5 flex max-w-full gap-1.5 overflow-x-auto border-b border-border pb-2.5 scrollbar-none sm:mt-4 sm:flex-wrap">
            {categories.map((entry) => (
              <Button
                key={entry}
                type="button"
                variant="ghost"
                onClick={() => handleCategoryChange(entry)}
                className={cn(
                  "h-7 shrink-0 rounded-lg px-2.5 py-0 text-[9px] font-bold uppercase tracking-wider transition duration-300 sm:rounded-xl sm:px-3 sm:text-[10px]",
                  category === entry
                    ? "bg-black text-white shadow-sm"
                    : "border border-border bg-card/40 text-foreground/60 hover:bg-card hover:text-foreground"
                )}
              >
                {entry}
              </Button>
            ))}
          </div>

          {/* Catalog count indicators */}
          <div className="mt-2.5 flex items-center justify-between gap-3 text-[9px] font-extrabold uppercase tracking-wider text-foreground/45 sm:text-[10px]">
            <span>{filtered.length} movements</span>
            <span className="text-foreground/30">{page + 1}/{pageCount || 1}</span>
          </div>

          {/* Movement List items - paginated */}
          <div className="mt-2.5 space-y-1.5 sm:space-y-2">
            {paginatedExercises.map((exercise) => {
              const isChosen = exercise.id === selected?.id;
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => setSelectedId(exercise.id)}
                  className={cn(
                    "group relative w-full rounded-lg border p-2 text-left transition duration-200 sm:rounded-xl sm:p-3",
                    isChosen
                      ? "border-black/20 bg-foreground/5 shadow-sm"
                      : "border-border bg-card/40 hover:bg-card/80"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[10.5px] font-semibold leading-snug text-foreground sm:text-[11px]">{exercise.name}</p>
                      <p className="mt-0.5 text-[9px] text-foreground/40 font-bold uppercase tracking-wider">{exercise.equipment}</p>
                    </div>
                    <Badge className="max-w-[92px] shrink-0 truncate border-transparent bg-foreground/5 px-2 py-0.5 text-[8px] font-bold uppercase text-foreground/60 sm:max-w-none sm:text-[9px]">
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 rounded-lg border border-border bg-card/40 px-2.5 py-0 text-[10px] font-bold transition hover:bg-card disabled:opacity-30"
              >
                ← Prev
              </Button>
              <span className="text-[10px] text-foreground/40 font-semibold">{page + 1} of {pageCount}</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="h-8 rounded-lg border border-border bg-card/40 px-2.5 py-0 text-[10px] font-bold transition hover:bg-card disabled:opacity-30"
              >
                Next →
              </Button>
            </div>
          )}
        </Card>

        {/* RIGHT COLUMN: Biomechanics Inspector Map & Setup */}
        {selected ? (
          <div className={cn("min-w-0 space-y-3 md:space-y-6", query.trim() ? "block" : "hidden sm:block")}>
            
            <div>
            <MuscleMap 
              intensities={exerciseIntensities} 
              profile={data.profile} 
              title={`${selected.name} muscles`} 
            />
            </div>

            <Card className="space-y-3 rounded-xl border-transparent bg-card/70 p-3 shadow-[0_15px_50px_rgba(0,0,0,0.05)] backdrop-blur md:space-y-6 md:rounded-[32px] md:p-8">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 md:gap-4 md:pb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-xl">{selected.name}</h3>
                  <p className="text-[11px] text-foreground/45 mt-1 leading-snug font-medium md:text-xs">
                    {selected.category} • {selected.equipment}
                  </p>
                </div>

                {selected.videoUrl && (
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-border hover:bg-foreground/5 hover:text-foreground font-semibold text-xs flex gap-1.5 items-center">
                    <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="h-4 w-4" />
                      <span>Watch demo</span>
                    </a>
                  </Button>
                )}
              </div>

              {selected.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-border bg-black/[0.02]">
                  <img
                    src={selected.imageUrl}
                    alt={selected.name}
                    className="h-40 w-full object-cover transition duration-500 hover:scale-105 md:h-56"
                  />
                </div>
              )}

              {/* Target muscle details */}
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <div className="rounded-lg border border-border bg-card/45 p-2.5 sm:rounded-xl sm:p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 mb-2">
                    Primary
                  </p>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                    {selected.primaryMuscles.slice(0, 6).map((muscle) => (
                      <Badge key={muscle} className="bg-black/8 border-transparent text-foreground/70 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        {muscle}
                      </Badge>
                    ))}
                    {selected.primaryMuscles.length > 6 && (
                      <Badge className="bg-foreground/5 border-transparent text-foreground/40 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        +{selected.primaryMuscles.length - 6}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="rounded-lg border border-border bg-card/45 p-2.5 sm:rounded-xl sm:p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/40 mb-2">
                    Secondary
                  </p>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                    {selected.secondaryMuscles.slice(0, 6).map((muscle) => (
                      <Badge key={muscle} className="bg-foreground/5 border-transparent text-foreground/50 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        {muscle}
                      </Badge>
                    ))}
                    {selected.secondaryMuscles.length > 6 && (
                      <Badge className="bg-foreground/5 border-transparent text-foreground/30 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        +{selected.secondaryMuscles.length - 6}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Setup list instructions */}
              <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3 md:rounded-2xl md:p-5">
                <div className="flex items-center gap-2 border-b border-border pb-2 text-foreground/50">
                  <BookOpen className="h-4 w-4 text-foreground/45" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Setup cues</span>
                </div>
                <ol className="list-decimal mt-3 space-y-2.5 pl-4 text-xs leading-relaxed text-foreground/70 md:mt-4 md:space-y-3.5">
                  {selected.instructions.slice(0, 4).map((instruction) => (
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
