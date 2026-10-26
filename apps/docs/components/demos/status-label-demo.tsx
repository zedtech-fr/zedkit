import { Stack, StatusLabel } from "@zedtech/zedkit-ui";

export function StatusLabelDemo() {
  return (
    <Stack gap={2}>
      <StatusLabel tone="loading">Saving report…</StatusLabel>
      <StatusLabel tone="saved">All changes saved</StatusLabel>
      <StatusLabel tone="error">Could not save</StatusLabel>
      <StatusLabel tone="offline">You are offline</StatusLabel>
    </Stack>
  );
}
