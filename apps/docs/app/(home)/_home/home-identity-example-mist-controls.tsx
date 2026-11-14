"use client";

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stack } from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "./i18n/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.mist;

export function HomeIdentityExampleMistControls({
  workspaceId,
  regionId,
  workspace,
  region,
  onWorkspace,
  onRegion,
}: {
  workspaceId: string;
  regionId: string;
  workspace: string;
  region: string;
  onWorkspace: (value: string) => void;
  onRegion: (value: string) => void;
}) {
  return (
    <Stack gap="md" className="content-shrink sm:flex-row sm:flex-wrap sm:items-end">
      <Stack gap="tight" className="content-shrink flex-1 basis-full sm:basis-text">
        <Label htmlFor={workspaceId}>{copy.workspaceLabel}</Label>
        <Input
          id={workspaceId}
          value={workspace}
          onChange={(event) => onWorkspace(event.target.value)}
        />
      </Stack>
      <Stack gap="tight" className="content-shrink flex-1 basis-full sm:basis-text">
        <Label htmlFor={regionId}>{copy.regionLabel}</Label>
        <Select value={region} onValueChange={onRegion}>
          <SelectTrigger id={regionId} aria-label={copy.regionLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {copy.regions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>
    </Stack>
  );
}
