"use client";

import { Card, CardContent, Heading, Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import type { IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const copy = homeIdentityLooksCopy.expression;

function Label({ children }: { children: string }) {
  return (
    <Text variant="muted" className="text-xs font-medium tracking-wide uppercase">
      {children}
    </Text>
  );
}

/** Press and Maison: a page of reading, where a serif headline and a capped measure are the evidence. */
function Editorial() {
  return (
    <Stack gap={3} className="min-w-0 border-t border-border pt-4">
      <Label>{copy.editorial.label}</Label>
      <article className="max-w-prose min-w-0">
        <Heading level={3} className="font-(family-name:--zk-font-display) text-balance">
          {copy.editorial.title}
        </Heading>
        <Text className="mt-2 text-pretty">{copy.editorial.lead}</Text>
        <Text variant="muted" className="mt-2 text-pretty">
          {copy.editorial.body}
        </Text>
        <blockquote className="mt-3 border-l-2 border-primary pl-3 font-(family-name:--zk-font-display)">
          {copy.editorial.quote}
        </blockquote>
      </article>
    </Stack>
  );
}

/** Volt: many short rows at once; density is the point. */
function Dense() {
  return (
    <Stack gap={2} className="min-w-0 border-t border-border pt-4">
      <Label>{copy.dense.label}</Label>
      <ul aria-label={copy.dense.ariaLabel} className="m-0 grid list-none gap-1 p-0 font-mono text-xs">
        {copy.dense.rows.map((row) => (
          <li key={row.time} className="flex min-w-0 items-center gap-2 border-b border-border/60 py-1 last:border-b-0">
            <span className="text-muted-foreground">{row.time}</span>
            <StatusDot tone={row.tone} pulse={false} />
            <span className="min-w-0 truncate">{row.event}</span>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

/** Glass: three surfaces stacked, each readable through the one above it. */
function Layered() {
  return (
    <Stack gap={2} className="min-w-0 border-t border-border pt-4">
      <Label>{copy.layered.label}</Label>
      <div className="relative min-w-0 overflow-hidden rounded-xl bg-linear-to-br from-primary/50 via-accent/40 to-background p-4">
        <Text className="font-medium">{copy.layered.back}</Text>
        <Card className="mt-4 ml-4 min-w-0">
          <CardContent className="pt-4">
            <Text>{copy.layered.card}</Text>
            <Card className="mt-3 ml-4 min-w-0 shadow-lg">
              <CardContent className="pt-4">
                <Text>{copy.layered.overlay}</Text>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Stack>
  );
}

/** Beside the shared task, the one thing this look shows best. Mist and Tide have none: the task is their proof. */
export function HomeIdentityLooksExpression({ identity }: { identity: IdentityId }) {
  if (identity === "press" || identity === "maison") return <Editorial />;
  if (identity === "volt") return <Dense />;
  if (identity === "glass") return <Layered />;
  return null;
}
