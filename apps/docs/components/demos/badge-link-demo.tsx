import { Badge, Stack, Text } from "@zedtech/zedkit-ui";

export function BadgeLinkDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
      <Text>Harbor Studio platform</Text>
      <Badge asChild variant="secondary">
        <a href="#status">all systems go</a>
      </Badge>
    </Stack>
  );
}
