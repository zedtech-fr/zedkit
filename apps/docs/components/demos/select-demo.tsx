"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

const DELIVERY: Record<string, string> = {
  eu: "Delivery in 2 to 3 working days.",
  us: "Delivery in 5 to 7 working days.",
  apac: "Delivery in 7 to 10 working days.",
};

export function SelectDemo() {
  const [region, setRegion] = React.useState<string | undefined>(undefined);
  return (
    <Stack gap={2} className="min-w-0">
      <Select {...(region === undefined ? {} : { value: region })} onValueChange={setRegion}>
        <SelectTrigger aria-label="Pick a region">
          <SelectValue placeholder="Pick a region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eu">Europe</SelectItem>
          <SelectItem value="us">Americas</SelectItem>
          <SelectItem value="apac">Asia-Pacific</SelectItem>
        </SelectContent>
      </Select>
      <Text variant="muted" className="text-xs" aria-live="polite">
        {region ? DELIVERY[region] : "Shipping options depend on the region."}
      </Text>
    </Stack>
  );
}
