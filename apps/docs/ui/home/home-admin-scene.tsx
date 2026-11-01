import { Badge, Button, ProgressBar, Stack, StatusLabel, Text } from "@zedtech/zedkit-ui";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const SCENE_TITLE_CLASS =
  "font-(family-name:--zk-font-display) text-2xl leading-tight font-semibold text-balance";

const s = homeCopy.adminScene;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={1}>
      <Text className="font-(family-name:--zk-font-display) text-xl font-semibold">{value}</Text>
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        {label}
      </Text>
    </Stack>
  );
}

/** Admin dashboard scene reused in the hero preview and the use cases scroll. */
export function HomeAdminScene() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP}>
      <Stack direction="horizontal" gap={2} className="items-center justify-between">
        <Badge>{s.ordersBadge}</Badge>
        <StatusLabel tone="saved">{s.savedStatus}</StatusLabel>
      </Stack>
      <Text className={SCENE_TITLE_CLASS}>{s.title}</Text>
      <Stack direction="horizontal" gap={6} className="flex-wrap">
        <Stat value={s.stats.onTimeValue} label={s.stats.onTimeLabel} />
        <Stat value={s.stats.reviewValue} label={s.stats.reviewLabel} />
        <Stat value={s.stats.lateValue} label={s.stats.lateLabel} />
      </Stack>
      <ProgressBar value={72} label={s.progressLabel} />
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button size="sm" tabIndex={-1}>
          {s.approveSelected}
        </Button>
        <Button size="sm" variant="outline" tabIndex={-1}>
          {s.exportCsv}
        </Button>
      </Stack>
    </Stack>
  );
}
