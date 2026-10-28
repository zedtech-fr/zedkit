"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { enUS, fr } from "react-day-picker/locale";

import { useUiMessages } from "./ui-provider.js";
import { cn } from "./utils.js";

export type CalendarProps = DayPickerProps;

export function formatCalendarDate(date: Date, locale: "en" | "fr"): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

/** Month grid. Locale and prev/next labels follow `ZedkitUiProvider`. */
export function Calendar({ className, locale, labels, ...props }: CalendarProps) {
  const messages = useUiMessages();
  return (
    <div data-slot="calendar">
      <DayPicker
        locale={locale ?? (messages.locale === "fr" ? fr : enUS)}
        labels={{
          labelPrevious: () => messages.previous,
          labelNext: () => messages.next,
          ...labels,
        }}
        className={cn(className)}
        {...props}
      />
    </div>
  );
}
