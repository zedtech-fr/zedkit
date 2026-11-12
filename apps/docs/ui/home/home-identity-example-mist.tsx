"use client";

import { useId, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Heading,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";
import { HomeIdentityExampleMistControls } from "@/ui/home/home-identity-example-mist-controls";

const copy = homeIdentityExamplesCopy.mist;

type Settings = { workspace: string; region: string };

const INITIAL: Settings = { workspace: copy.workspaceValue, region: copy.regionValue };

/** Editable settings with a saved baseline: Save keeps them, Discard returns to the last save. */
function useProjectSettings() {
  const [current, setCurrent] = useState<Settings>(INITIAL);
  const [saved, setSaved] = useState<Settings>(INITIAL);
  const [status, setStatus] = useState("");
  const dirty = (Object.keys(current) as (keyof Settings)[]).some((key) => current[key] !== saved[key]);
  return {
    current,
    message: status || (dirty ? copy.unsaved : ""),
    edit: <K extends keyof Settings>(key: K) => (value: Settings[K]) => {
      setCurrent((prev) => ({ ...prev, [key]: value }));
      setStatus("");
    },
    save() {
      setSaved(current);
      setStatus(copy.saved);
    },
    discard() {
      setCurrent(saved);
      setStatus(copy.discarded);
    },
  };
}

/** Save is the one primary action; Discard is its quiet pair. */
function ProjectActions({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap">
      <Button type="button" onClick={onSave}>
        {copy.save}
      </Button>
      <Button type="button" variant="secondary" onClick={onDiscard}>
        {copy.discard}
      </Button>
    </Stack>
  );
}

export function HomeIdentityExampleMist() {
  const workspaceId = useId();
  const regionId = useId();
  const settings = useProjectSettings();

  return (
    <Card className="content-shrink">
      <CardHeader>
        <Stack direction="horizontal" gap="sm" className="items-start justify-between">
          <Stack gap="tight" className="content-shrink">
            <Heading level={3} className="text-specimen-title text-balance">
              {copy.heading}
            </Heading>
            <Text variant="muted">{copy.description}</Text>
          </Stack>
          <Badge variant="success">{copy.status}</Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack gap="lg" className="content-shrink">
          <HomeIdentityExampleMistControls
            workspaceId={workspaceId}
            regionId={regionId}
            workspace={settings.current.workspace}
            region={settings.current.region}
            onWorkspace={settings.edit("workspace")}
            onRegion={settings.edit("region")}
          />
          <ProjectActions onSave={settings.save} onDiscard={settings.discard} />
          <Text variant="muted" role="status" data-home-identity-status="">
            {settings.message}
          </Text>
        </Stack>
      </CardContent>
    </Card>
  );
}
