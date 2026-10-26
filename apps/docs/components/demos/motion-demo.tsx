"use client";

import { useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Stack, Text } from "@zedtech/zedkit-ui";

// Literal class names so Tailwind generates each stagger step.
const STEPS = [
  { title: "Install", description: "One package, one CSS import.", className: "hover-lift animate-fade-up stagger-1" },
  { title: "Compose", description: "Kit components, tokens only.", className: "hover-lift animate-fade-up stagger-2" },
  { title: "Ship", description: "Same code in light and dark.", className: "hover-lift animate-fade-up stagger-3" },
] as const;

export function MotionDemo() {
  const [run, setRun] = useState(0);
  return (
    <Stack gap={4}>
      <Stack key={`cards-${run}`} gap={3}>
        {STEPS.map((step) => (
          <Card key={step.title} className={step.className}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Stack>
      <Stack key={`list-${run}`} gap={1} data-stagger="in">
        <Text variant="muted">Children of data-stagger enter one after another.</Text>
        <Text variant="muted">Reduced motion shows everything at once.</Text>
      </Stack>
      <Stack direction="horizontal" gap={2}>
        <Button className="hover-press" onClick={() => setRun((n) => n + 1)}>
          Replay entrance
        </Button>
      </Stack>
    </Stack>
  );
}
