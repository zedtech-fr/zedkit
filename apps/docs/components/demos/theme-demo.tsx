"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Stack, Switch, Label, Text } from "@zedtech/zedkit-ui";

/** Same markup, one extra `dark` class on the wrapper: the tokens do the rest. */
function WeeklyCard({ scope, label }: { scope?: "dark"; label: string }) {
  return (
    <section aria-label={label} className={`${scope ?? ""} min-w-0 rounded-lg bg-background p-3 text-foreground`}>
      <Card>
        <CardHeader>
          <CardDescription>Orders this week</CardDescription>
          <CardTitle>1,284</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap={3}>
            <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
              <Badge variant="success">+8%</Badge>
              <Badge variant="destructive">3 late</Badge>
              <Badge variant="outline">Oct 20–26</Badge>
            </Stack>
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Button size="sm">Open report</Button>
              <Button size="sm" variant="outline">
                Export CSV
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </section>
  );
}

/** The page theme next to a `dark` scope, from the one stylesheet import (both read the same tokens). */
export function ThemeDemo() {
  return (
    <Stack className="grid min-w-0 gap-3 sm:grid-cols-2">
      <WeeklyCard label="Page theme" />
      <WeeklyCard label="Dark scope" scope="dark" />
    </Stack>
  );
}

const DARK_CLASS: string = "dark";

const RELEASES = [
  { name: "Storefront 4.12", state: "Deployed", trend: "up" },
  { name: "Checkout 2.3", state: "Rolled back", trend: "down" },
  { name: "Search index", state: "Deployed", trend: "up" },
] as const;

/** Your own components read semantic tokens (`bg-muted`, `text-success`, `border-border`), never raw colours. */
export function ThemeTokensDemo() {
  const [dark, setDark] = useState(false);
  // The class name comes from a variable: the app, not the kit, owns the `dark` switch.
  const scope = dark ? DARK_CLASS : "";
  return (
    <Stack className={`${scope} min-w-0 rounded-lg bg-background p-3 text-foreground`}>
      <Stack gap={3} className="min-w-0 rounded-lg border border-border p-4">
        <Stack direction="horizontal" gap={2} className="items-center justify-between">
          <Text as="span" className="font-medium">
            Releases
          </Text>
          <Stack direction="horizontal" gap={2} className="items-center">
            <Switch id="theme-tokens-dark" checked={dark} onCheckedChange={setDark} />
            <Label htmlFor="theme-tokens-dark">Dark</Label>
          </Stack>
        </Stack>
        <ul aria-label="Releases" className="divide-y divide-border rounded-md bg-muted">
          {RELEASES.map((release) => (
            <li key={release.name} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2 text-sm">
              <Text as="span" className="min-w-0 truncate">{release.name}</Text>
              <Badge variant={release.trend === "up" ? "success" : "destructive"} className="shrink-0 gap-1">
                {release.trend === "up" ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                {release.state}
              </Badge>
            </li>
          ))}
        </ul>
        <Text variant="muted" className="text-xs">
          Updated 4 minutes ago
        </Text>
      </Stack>
    </Stack>
  );
}

/** The button a settings page needs; the app flips the `dark` class, here only this panel. */
export function ThemeToggleDemo() {
  const [dark, setDark] = useState(false);
  // The class name comes from a variable: the app, not the kit, owns the `dark` switch.
  const scope = dark ? DARK_CLASS : "";
  return (
    <Stack className={`${scope} min-w-0 rounded-lg bg-background p-3 text-foreground`}>
      <Stack gap={3} className="min-w-0 rounded-lg border border-border p-4">
        <Stack gap={1}>
          <Text as="span" className="font-medium">
            Appearance
          </Text>
          <Text variant="muted" className="text-sm">
            Choose how the dashboard looks on this device.
          </Text>
        </Stack>
        <Button variant="outline" className="w-fit" aria-pressed={dark} onClick={() => setDark((value) => !value)}>
          Dark theme
        </Button>
      </Stack>
    </Stack>
  );
}
