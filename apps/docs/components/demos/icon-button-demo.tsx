"use client";

import { useState } from "react";
import { Archive, Copy, Pencil, RefreshCw, Share2, Trash2 } from "lucide-react";
import { Button, Heading, IconButton, Stack, Text } from "@zedtech/zedkit-ui";

/** Project header toolbar: every button is icon-only, so each one needs its `label`. */
export function IconButtonDemo() {
  const [message, setMessage] = useState("Nothing changed yet.");
  return (
    <Stack className="min-w-0 rounded-lg border border-border bg-background">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Stack gap={1} className="min-w-0">
          <Heading level={2} className="truncate">
            Spring campaign
          </Heading>
          <Text variant="muted" className="text-xs">
            Harbor Studio · 12 tasks
          </Text>
        </Stack>
        <Stack direction="horizontal" gap={1} className="shrink-0">
          <IconButton label="Refresh tasks" variant="ghost" onClick={() => setMessage("Task list refreshed.")}>
            <RefreshCw />
          </IconButton>
          <IconButton label="Share project" variant="ghost" onClick={() => setMessage("Link copied to the clipboard.")}>
            <Share2 />
          </IconButton>
          <IconButton label="Archive project" variant="outline" onClick={() => setMessage("Project archived.")}>
            <Archive />
          </IconButton>
        </Stack>
      </header>
      <Stack gap={1} className="p-4">
        <Text role="status" variant="muted" className="text-sm">
          {message}
        </Text>
        <Text variant="muted" className="text-xs">
          Hover or long-press a button to read its name. Screen readers announce the same text.
        </Text>
      </Stack>
    </Stack>
  );
}

const INITIAL_TASKS = [
  { id: 1, title: "Write the launch announcement", owner: "Inès", due: "Nov 4" },
  { id: 2, title: "Pick the hero photo", owner: "Malo", due: "Nov 6" },
  { id: 3, title: "Review the pricing page copy", owner: "Sam", due: "Nov 12" },
];

/** Row actions in a list: the task name is repeated in each label so rows stay distinguishable. */
export function IconButtonRowsDemo() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [duplicates, setDuplicates] = useState(0);
  return (
    <Stack gap={3} className="min-w-0">
      <ul aria-label="Tasks" className="divide-y divide-border rounded-lg border border-border bg-background">
        {tasks.map((task) => (
          <li key={task.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-2">
            <Stack gap={1} className="min-w-0 flex-1">
              <Text as="span" className="font-medium">
                {task.title}
              </Text>
              <Text as="span" variant="muted" className="text-xs">
                {task.owner} · due {task.due}
              </Text>
            </Stack>
            <Stack direction="horizontal" gap={1} className="shrink-0">
              <IconButton label={`Edit ${task.title}`} variant="ghost">
                <Pencil />
              </IconButton>
              <IconButton label={`Duplicate ${task.title}`} variant="ghost" onClick={() => setDuplicates((n) => n + 1)}>
                <Copy />
              </IconButton>
              <IconButton
                label={`Delete ${task.title}`}
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setTasks((list) => list.filter((item) => item.id !== task.id))}
              >
                <Trash2 />
              </IconButton>
            </Stack>
          </li>
        ))}
        {tasks.length === 0 ? (
          <li className="px-4 py-3">
            <Text variant="muted">No tasks left.</Text>
          </li>
        ) : null}
      </ul>
      <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
        <Button variant="outline" size="sm" onClick={() => setTasks(INITIAL_TASKS)}>
          Restore tasks
        </Button>
        <Text role="status" variant="muted" className="text-xs">
          {duplicates === 0 ? "No task duplicated." : `${duplicates} duplicate${duplicates > 1 ? "s" : ""} requested.`}
        </Text>
      </Stack>
    </Stack>
  );
}
