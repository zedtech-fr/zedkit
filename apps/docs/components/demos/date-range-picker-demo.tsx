"use client";

import { useState } from "react";
import { DateRangePicker, Field, FieldLabel, type DateRangePickerProps } from "@zedtech/zedkit-ui";

export function DateRangePickerDemo() {
  const [span, setSpan] = useState<DateRangePickerProps["value"]>();
  return (
    <Field>
      <FieldLabel htmlFor="leave">Leave</FieldLabel>
      <DateRangePicker
        id="leave"
        value={span}
        onValueChange={setSpan}
        defaultMonth={new Date(2026, 9, 1)}
        today={new Date(2026, 9, 15)}
      />
    </Field>
  );
}
