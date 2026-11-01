"use client";

import {
  Badge,
  Button,
  Calendar,
  DetailPanel,
  Heading,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { DOCS_TYPE_H3_CLASS, DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const MONTH = new Date(2026, 9, 1);
const DAY = new Date(2026, 9, 15);

const copy = homeCopy.heroScenes;

/** Compact drawer and calendar specimens for the hero scroll stage. */
export function HomeHeroDrawerScene() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} className="min-w-0 p-3 sm:p-4">
      <Stack gap={1}>
        <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
          {copy.drawerTitle}
        </Heading>
        <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
          {copy.drawerSub}
        </Text>
      </Stack>
      <Text className="font-medium">{copy.drawerTask}</Text>
      <DetailPanel
        items={[
          { label: copy.assignee, value: copy.assigneeValue },
          { label: copy.due, value: copy.dueValue },
          {
            label: copy.status,
            value: <Badge>{copy.statusValue}</Badge>,
          },
        ]}
      />
      <Stack direction="horizontal" className="justify-end">
        <Button size="sm" tabIndex={-1}>
          {copy.save}
        </Button>
      </Stack>
    </Stack>
  );
}

export function HomeHeroCalendarScene() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} className="min-w-0 items-center p-3 sm:p-4">
      <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
        {copy.calendarCaption}
      </Text>
      <Calendar mode="single" defaultMonth={MONTH} today={DAY} />
    </Stack>
  );
}
