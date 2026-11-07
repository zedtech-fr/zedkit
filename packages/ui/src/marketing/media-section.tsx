import { useId } from "react";
import type * as React from "react";
import { Check } from "lucide-react";

import { Container } from "../layout.js";
import { Heading, Text } from "../typography.js";
import { cn } from "../utils.js";
import { GlassSurface } from "./glass-surface.js";

export type MediaSectionProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Section title, rendered as a level-2 heading. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Short points under the description, each marked with a check. */
  points?: React.ReactNode[] | undefined;
  /** Calls to action (buttons or links). */
  actions?: React.ReactNode;
  /** Picture, recording, live demo or code sample, framed on a glass surface. */
  media: React.ReactNode;
  /** Put the media before the text from `lg` up (the text always comes first on phones). */
  reverse?: boolean | undefined;
};

/** A use case told as text beside a framed picture or demo; alternate `reverse` down a page. */
function MediaSection({
  title,
  description,
  points,
  actions,
  media,
  reverse = false,
  className,
  ...props
}: MediaSectionProps) {
  const titleId = useId();
  return (
    <section
      data-slot="media-section"
      aria-labelledby={titleId}
      className={cn("py-section-md sm:py-section-lg", className)}
      {...props}
    >
      <Container width="default" className="grid items-center gap-section-stack lg:grid-cols-2">
        <div className={cn("flex content-shrink flex-col gap-stack-lg", reverse && "lg:order-last")}>
          <Heading id={titleId} level={2} className="text-3xl font-semibold text-balance">
            {title}
          </Heading>
          {description ? <Text className="text-muted-foreground">{description}</Text> : null}
          {points && points.length > 0 ? (
            <ul className="flex list-none flex-col gap-stack-sm flush">
              {points.map((point, index) => (
                <li key={index} className="flex gap-stack-md">
                  <Check aria-hidden="true" className="mt-1 size-icon shrink-0 text-primary" />
                  <span className="content-shrink">{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {actions ? (
            <div
              data-slot="media-section-actions"
              className="flex w-full flex-col gap-stack-md actions-offset *:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:*:w-auto"
            >
              {actions}
            </div>
          ) : null}
        </div>
        <GlassSurface data-slot="media-section-media" tone="raised" padding="sm" className="content-shrink overflow-hidden">
          {media}
        </GlassSurface>
      </Container>
    </section>
  );
}

export { MediaSection };
