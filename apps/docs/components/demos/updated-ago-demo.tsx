import { Stack, UpdatedAgo } from "@zedtech/zedkit-ui";

export function UpdatedAgoDemo() {
  return (
    <Stack gap={2}>
      <UpdatedAgo date={Date.now() - 3 * 60_000} />
      <UpdatedAgo date={Date.now() - 2 * 3_600_000} />
    </Stack>
  );
}
