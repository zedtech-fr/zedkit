import * as React from "react";

import { cn } from "./utils.js";

/** Most scenes one stage can pin (the pinned timing is written out per count in `scroll-scenes.css`). */
export const SCROLL_SCENES_MAX = 8;

export interface ScrollScene {
  /** Stable key for the scene. */
  id: string;
  /** Text beside the visual: a title and a line or two. Keep it readable text. */
  caption: React.ReactNode;
  /** The visual. Decorative previews should carry `aria-hidden` and `inert` themselves. */
  children: React.ReactNode;
}

export interface ScrollScenesProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Two to eight scenes get the pinned stage; any other count stays stacked. */
  scenes: readonly ScrollScene[];
}

/**
 * One pinned stage that fades from scene to scene as the page scrolls.
 * Pure CSS scroll-driven animation (no script, no scroll hijacking): the
 * browser keeps native scrolling. Where scroll timelines are missing or
 * reduced motion is on, the scenes are plain blocks, one under the other,
 * with the same content. See `scroll-scenes.css`.
 */
export function ScrollScenes({ scenes, className, ...props }: ScrollScenesProps) {
  const count = scenes.length;
  const pinned = count >= 2 && count <= SCROLL_SCENES_MAX;
  return (
    <div data-slot="scroll-scenes" data-scroll-scenes="" data-scene-count={pinned ? count : undefined} className={cn("min-w-0", className)} {...props}>
      <div data-scroll-scenes-stage="" className="flex min-w-0 flex-col gap-10 md:gap-16">
        {scenes.map((scene) => (
          <article key={scene.id} data-scroll-scene={scene.id} className="grid min-w-0 items-start gap-4 md:grid-cols-3">
            <div data-scroll-scene-caption="" className="min-w-0 md:sticky md:top-24">
              {scene.caption}
            </div>
            <div data-scroll-scene-visual="" className="min-w-0 md:col-span-2">
              {scene.children}
            </div>
          </article>
        ))}
        <ol data-scroll-scenes-progress="" aria-hidden="true">
          {scenes.map((scene) => (
            <li key={scene.id} />
          ))}
        </ol>
      </div>
    </div>
  );
}
