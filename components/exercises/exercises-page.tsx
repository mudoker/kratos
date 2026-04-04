"use client";

import { useMemo, useState } from "react";
import type { DashboardData, ExerciseCategory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const categories: Array<ExerciseCategory | "All"> = ["All", "Push", "Pull", "Legs", "Core", "Conditioning", "Mobility"];

export function ExercisesPage({ data }: { data: DashboardData }) {
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

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="flex min-h-[760px] flex-col p-6">
        <PageHeader
          eyebrow="Exercise Library"
          title="Browse movements by stimulus."
          description="Filter the catalog, inspect the target tissue on the body map, and keep setup cues close to the plan."
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by exercise or muscle"
          className="mt-6"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === entry
                  ? "bg-[color:var(--brand)] text-white"
                  : "border border-[color:var(--border)] bg-white/65 text-[color:var(--muted-foreground)]"
              }`}
            >
              {entry}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Browse movements
          </p>
          <Badge>{filtered.length} results</Badge>
        </div>
        <ScrollArea className="mt-4 flex-1 pr-2 xl:max-h-[calc(100vh-20rem)]">
          <div className="grid gap-3 pr-4">
            {filtered.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedId(exercise.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  exercise.id === selected?.id
                    ? "border-[color:var(--brand)] bg-black/6"
                    : "border-[color:var(--border)] bg-white/60 hover:bg-white/75"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{exercise.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{exercise.equipment}</p>
                  </div>
                  <Badge>{exercise.category}</Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {selected ? (
        <div className="space-y-6">
          <MuscleMap slugs={selected.bodyRegionSlugs} profile={data.profile} title={selected.name} />
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{selected.name}</CardTitle>
                <CardDescription className="mt-2">
                  {selected.category} • {selected.equipment} • default rest {selected.defaultRestSeconds}s
                </CardDescription>
              </div>
              <Badge>{selected.category}</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Primary muscles
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.primaryMuscles.map((muscle) => (
                    <Badge key={muscle}>{muscle}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Secondary muscles
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.secondaryMuscles.map((muscle) => (
                    <Badge key={muscle}>{muscle}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Setup and execution
              </p>
              <ol className="mt-4 space-y-3 pl-5 text-sm leading-7 text-[color:var(--foreground)]">
                {selected.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
