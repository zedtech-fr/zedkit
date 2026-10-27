"use client";

import { useState } from "react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";

const TASKS = ["Write the launch email", "Review the product photos", "Publish the sale banner"];

export function MotionStaggerDemo() {
  const [run, setRun] = useState(0);
  return (
    <Stack gap={3} className="min-w-0">
      <Stack key={run} gap={2} data-stagger="in">
        {TASKS.map((task) => (
          <Text key={task}>{task}</Text>
        ))}
      </Stack>
      <Stack direction="horizontal">
        <Button variant="outline" onClick={() => setRun((n) => n + 1)}>
          Replay
        </Button>
      </Stack>
    </Stack>
  );
}
