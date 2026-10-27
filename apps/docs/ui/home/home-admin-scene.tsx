import { Badge, Button, ProgressBar, Stack, StatusLabel, Text } from "@zedtech/zedkit-ui";
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";

const SCENE_TITLE_CLASS =
  "font-(family-name:--zk-font-display) text-2xl leading-tight font-semibold text-balance";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={1}>
      <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">{value}</Text>
      <Text variant="muted" className="text-xs">{label}</Text>
    </Stack>
  );
}

/** Admin dashboard scene reused in the hero preview and use-cases tabs. */
export function HomeAdminScene() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP}>
      <Stack direction="horizontal" gap={2} className="items-center justify-between">
        <Badge>Orders</Badge>
        <StatusLabel tone="saved">All changes saved</StatusLabel>
      </Stack>
      <Text className={SCENE_TITLE_CLASS}>128 open orders this week</Text>
      <Stack direction="horizontal" gap={6} className="flex-wrap">
        <Stat value="94%" label="On time" />
        <Stat value="12" label="To review" />
        <Stat value="3" label="Late" />
      </Stack>
      <ProgressBar value={72} label="Fulfilment this week" />
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button size="sm" tabIndex={-1}>Approve selected</Button>
        <Button size="sm" variant="outline" tabIndex={-1}>Export CSV</Button>
      </Stack>
    </Stack>
  );
}
