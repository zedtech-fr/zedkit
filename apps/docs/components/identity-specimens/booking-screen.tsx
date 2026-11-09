import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import type { BookingComposition } from "@/components/i18n/identity-specimen-compositions";

/** Booking: the service and price first, then times with one preselected, then one action. */
export function BookingScreen({ copy }: { copy: BookingComposition }) {
  return (
    <Stack gap="md">
      <Heading level={4} typeRole="cardTitle" className="border-b border-border rule-gap">
        {copy.brand}
      </Heading>
      <Stack direction="horizontal" gap="md" className="items-baseline justify-between">
        <Stack gap="tight">
          <Heading level={3} typeRole="band">
            {copy.service}
          </Heading>
          <Text as="span" typeRole="small" className="text-muted-foreground">
            {copy.detail}
          </Text>
        </Stack>
        <Text as="span" typeRole="body" className="font-semibold tabular-nums">
          {copy.price}
        </Text>
      </Stack>
      <Stack gap="sm">
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {copy.dayLabel}
        </Text>
        <ul className="trim-margin grid list-none grid-quad gap-stack-sm flush">
          {copy.slots.map((slot) => (
            <li key={slot}>
              <Button
                size="sm"
                variant={slot === copy.selectedSlot ? "default" : "outline"}
                tabIndex={-1}
                className="w-full px-flush tabular-nums"
              >
                {slot}
              </Button>
            </li>
          ))}
        </ul>
      </Stack>
      <Button size="sm" tabIndex={-1} className="w-full">
        {copy.primary}
      </Button>
      <Text typeRole="small" className="trim-margin text-muted-foreground">
        {copy.reassurance}
      </Text>
    </Stack>
  );
}
