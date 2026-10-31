"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Stack, Text } from "@zedtech/zedkit-ui";
import { homeGalleryDemos } from "@/components/home-gallery-demos";
import type { GalleryCard } from "@/content/gallery";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_TITLE_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

export function HomeGalleryCard({ card, className = "min-w-0" }: { card: GalleryCard; className?: string }) {
  const Demo = card.demo ? homeGalleryDemos[card.demo] : undefined;
  return (
    <Card className={className} data-home-gallery-card="">
      <CardHeader className="space-y-0">
        <CardTitle className={HOME_CARD_TITLE_CLASS}>
          <Link href={card.href}>{card.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
            {card.need}
          </Text>
          {Demo ? <Demo /> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
