import { Badge, Stack } from "@zedtech/zedkit-ui";

export function BadgeDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Badge>beta</Badge>
      <Badge variant="secondary">12 events</Badge>
      <Badge variant="outline">stable</Badge>
      <Badge asChild variant="destructive">
        <a href="#badge-demo">action link</a>
      </Badge>
    </Stack>
  );
}
