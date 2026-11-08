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
    <div data-slot="scroll-scenes" data-scroll-scenes="" data-scene-count={pinned ? count : undefined} className={cn("content-shrink", className)} {...props}>
      <div data-scroll-scenes-stage="" className="flex content-shrink flex-col gap-section-stack md:gap-scenes">
        {scenes.map((scene) => (
          <article key={scene.id} data-scroll-scene={scene.id} className="grid content-shrink items-start gap-stack-lg md:grid-trio">
            <div data-scroll-scene-caption="" className="content-shrink md:sticky md:top-caption">
              {scene.caption}
            </div>
            <div data-scroll-scene-visual="" className="content-shrink md:span-rest">
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
