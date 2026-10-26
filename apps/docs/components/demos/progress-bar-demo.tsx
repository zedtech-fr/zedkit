import { ProgressBar, Stack } from "@zedtech/zedkit-ui";

export function ProgressBarDemo() {
  return (
    <Stack gap={2}>
      <ProgressBar value={40} label="Uploading report" />
      <ProgressBar value={100} label="Upload complete" />
    </Stack>
  );
}
