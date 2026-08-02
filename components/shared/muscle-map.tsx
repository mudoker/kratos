"use client";

import { useMemo, useState } from "react";
import Body from "@mjcdev/react-body-highlighter";
import { RotateCcw } from "lucide-react";
import type { BodyHighlightSlug, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bodySlugs = new Set<BodyHighlightSlug>([
  "trapezius", "triceps", "forearm", "adductors", "calves", "neck", "deltoids", "hands", "feet", "head", "ankles", "tibialis", "obliques", "chest", "biceps", "abs", "quadriceps", "knees", "upper-back", "lower-back", "hamstring", "gluteal",
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
    // If we have intensity data (heatmap mode)
    if (intensities) {
      const activeData = intensities.map((item) => ({
        slug: item.slug,
        intensity: hoveredSlug === item.slug ? item.intensity + 4 : item.intensity,
      }));

      // If the currently hovered muscle isn't in the stimulus list, 
      // add it with a special "neutral highlight" intensity (Level 9)
      if (hoveredSlug && !intensities.find(i => i.slug === hoveredSlug)) {
        activeData.push({ slug: hoveredSlug, intensity: 9 });
      }
      return activeData;
    }

    // If we only have simple slugs (selection mode)
    const uniqueSlugs = [...new Set(slugs || [])];
    const baseData = uniqueSlugs.map((slug) => ({
      slug,
      intensity: hoveredSlug === slug ? 6 : 1, // 1 is base green, 6 is brighter yellow
    }));

    if (hoveredSlug && !uniqueSlugs.includes(hoveredSlug)) {
      baseData.push({ slug: hoveredSlug, intensity: 9 });
    }
    return baseData;
  }, [hoveredSlug, slugs, intensities]);

  const uniqueSlugs = useMemo(() => {
    if (intensities) return intensities.map((i) => i.slug);
    return [...new Set(slugs || [])];
  }, [slugs, intensities]);

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 text-foreground shadow-none sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">
            {title || "Target muscles"}
          </p>
          <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
            Hover a region to inspect stimulus.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setSide(side === "front" ? "back" : "front")}
          className="border-border bg-foreground/[0.035] text-foreground hover:bg-foreground/[0.06] [&_svg]:text-foreground"
        >
          <RotateCcw className="h-4 w-4" style={{ color: "var(--foreground)", stroke: "var(--foreground)" }} />
          {side === "front" ? "Back" : "Front"}
        </Button>
      </div>

      <div
        className="rounded-xl border border-border bg-background p-2 sm:p-4"
        onMouseMove={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const slug = target.getAttribute("id");
          if (!slug || !bodySlugs.has(slug as BodyHighlightSlug)) return;
          setHoveredSlug(slug as BodyHighlightSlug);
        }}
        onMouseLeave={() => setHoveredSlug(null)}
      >
        <div className="flex min-h-[320px] items-center justify-center rounded-lg bg-card sm:min-h-[480px]">
          <Body
            data={data}
            gender={profile.bodyGender}
            side={side}
            border="var(--border-strong)"
            scale={1.08}
            // 1-4: Base, 5-8: Brighter, 9: Neutral Highlight
            colors={[
              "#22c55e", "#eab308", "#f97316", "#ef4444", // 1-4
              "#4ade80", "#facc15", "#fb923c", "#f87171", // 5-8
              "#71717a" // 9 (neutral hover highlight)
            ]}
          />
        </div>
      </div>

      <div className="mt-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1 sm:mt-4 sm:max-h-none sm:gap-2 sm:overflow-visible">
        {uniqueSlugs.map((slug) => (
          <button
            key={slug}
            type="button"
            className="rounded-full"
            onMouseEnter={() => setHoveredSlug(slug)}
            onMouseLeave={() => setHoveredSlug(null)}
          >
            <Badge
              className={cn(
                "border-border bg-foreground/[0.055] px-2.5 py-1 text-[9px] font-bold tracking-[0.08em] text-foreground transition-colors hover:border-border-strong hover:bg-foreground/[0.09] sm:text-[10px]",
                hoveredSlug === slug && "border-foreground bg-foreground text-background"
              )}
            >
              {formatSlug(slug)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
