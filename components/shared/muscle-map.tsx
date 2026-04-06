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

  const activeSlug = hoveredSlug;

  return (
    <div className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            {title || "Target muscles"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Hover a region to inspect stimulus.
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
            // 1-4: Base, 5-8: Brighter, 9: Neutral Highlight
            colors={[
              "#82ca9d", "#ffd36b", "#ff9f0a", "#c81e1e", // 1-4
              "#a8e6cf", "#ffea8a", "#ffbf69", "#ff4d4d", // 5-8
              "#d1d5db" // 9 (Grey highlight for non-stimulus)
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {uniqueSlugs.map((slug) => (
          <button key={slug} type="button" onMouseEnter={() => setHoveredSlug(slug)} onMouseLeave={() => setHoveredSlug(null)}>
            <Badge className={hoveredSlug === slug ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white!" : undefined}>
              {formatSlug(slug)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
