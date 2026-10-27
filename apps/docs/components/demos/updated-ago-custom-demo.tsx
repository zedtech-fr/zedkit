import { Stack, Text, UpdatedAgo } from "@zedtech/zedkit-ui";

export function UpdatedAgoCustomDemo() {
  return (
    <Stack gap={1}>
      <Text className="font-medium">Product catalogue</Text>
      <UpdatedAgo date={Date.now() - 4 * 60_000} prefix="Synced" />
    </Stack>
  );
}
