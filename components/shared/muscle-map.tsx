"use client";

import { useMemo, useState } from "react";
import Body from "@mjcdev/react-body-highlighter";
import { RotateCcw } from "lucide-react";
import type { BodyHighlightSlug, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bodySlugs = new Set<BodyHighlightSlug>([
  "trapezius",
  "triceps",
  "forearm",
  "adductors",
  "calves",
  "neck",
  "deltoids",
  "hands",
  "feet",
  "head",
  "ankles",
  "tibialis",
  "obliques",
  "chest",
  "biceps",
  "abs",
  "quadriceps",
  "knees",
  "upper-back",
  "lower-back",
  "hamstring",
  "gluteal",
]);

const formatSlug = (slug: BodyHighlightSlug) => slug.replaceAll("-", " ");

export function MuscleMap({
  slugs,
  intensities,
  profile,
  title,
}: {
  slugs?: BodyHighlightSlug[];
  intensities?: Array<{ slug: BodyHighlightSlug; intensity: number }>;
  profile: Pick<UserProfile, "bodyGender">;
  title?: string;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [hoveredSlug, setHoveredSlug] = useState<BodyHighlightSlug | null>(null);

  const data = useMemo(() => {
    if (intensities) {
      return intensities.map((item) => ({
        slug: item.slug,
        intensity: hoveredSlug === item.slug ? Math.max(item.intensity, 2) : item.intensity,
      }));
    }
    const uniqueSlugs = [...new Set(slugs || [])];
    const visibleSlugs = [...new Set(hoveredSlug ? [...uniqueSlugs, hoveredSlug] : uniqueSlugs)];
    return visibleSlugs.map((slug) => ({
      slug,
      intensity: hoveredSlug === slug ? 2 : 1,
    }));
  }, [hoveredSlug, slugs, intensities]);

  const uniqueSlugs = useMemo(() => {
    if (intensities) return intensities.map((i) => i.slug);
    return [...new Set(slugs || [])];
  }, [slugs, intensities]);

  const activeSlug = hoveredSlug ?? uniqueSlugs[0] ?? null;

  return (
    <div className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            {title || "Target muscles"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Hover a region or label to isolate that muscle group on the map.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setSide(side === "front" ? "back" : "front")}
        >
          <RotateCcw className="h-4 w-4" />
          {side === "front" ? "Back" : "Front"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[22px] border border-[color:var(--border)] bg-black/[0.03] px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)] opacity-60">
            Inspecting Region
          </span>
          <span className="text-sm font-semibold text-[color:var(--foreground)]">
            {activeSlug ? formatSlug(activeSlug) : "hover a muscle"}
          </span>
        </div>
        {activeSlug && intensities && (
          <div className="ml-auto flex flex-col items-end text-right">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)] opacity-60">
              Stimulus Level
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[color:var(--foreground)]">
                {intensities.find((i) => i.slug === activeSlug)?.intensity || 0} / 4
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-1.5 w-3 rounded-full transition-colors",
                      (intensities.find((i) => i.slug === activeSlug)?.intensity || 0) >= step
                        ? "bg-[color:var(--brand)]"
                        : "bg-black/5"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-[24px] bg-[radial-gradient(circle_at_top,#ffffff_0%,#e4e4e4_100%)] p-4"
        onMouseMove={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const slug = target.getAttribute("id");
          if (!slug || !bodySlugs.has(slug as BodyHighlightSlug)) return;
          setHoveredSlug(slug as BodyHighlightSlug);
        }}
        onMouseLeave={() => setHoveredSlug(null)}
      >
        <div className="flex min-h-[480px] items-center justify-center">
          <Body
            data={data}
            gender={profile.bodyGender}
            side={side}
            border="none"
            scale={1.35}
            colors={["#82ca9d", "#ffd36b", "#ff9f0a", "#c81e1e"]}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {uniqueSlugs.map((slug) => (
          <button
            key={slug}
            type="button"
            onMouseEnter={() => setHoveredSlug(slug)}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            <Badge
              className={
                hoveredSlug === slug
                  ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white"
                  : undefined
              }
            >
              {formatSlug(slug)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
