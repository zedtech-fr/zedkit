"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "./button.js";
import { Calendar, formatCalendarDate, type CalendarProps } from "./calendar.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { useUiMessages } from "./ui-provider.js";
import { cn } from "./utils.js";

const triggerClass =
  "w-full justify-start font-normal group-data-[invalid=true]/field:border-destructive";

export type DatePickerProps = {
  value?: Date | undefined;
  defaultValue?: Date | undefined;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  disabledDays?: CalendarProps["disabled"];
  startMonth?: Date;
  endMonth?: Date;
  defaultMonth?: Date;
  today?: Date;
};

export type DateRangePickerProps = {
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  onValueChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  disabledDays?: CalendarProps["disabled"];
  startMonth?: Date;
  endMonth?: Date;
  defaultMonth?: Date;
  today?: Date;
};

function rangeText(range: DateRange | undefined, locale: "en" | "fr", fallback: string): string {
  if (!range?.from) return fallback;
  const from = formatCalendarDate(range.from, locale);
  return range.to ? `${from} – ${formatCalendarDate(range.to, locale)}` : from;
}

function skipUndef<T extends object>(obj: T): Partial<T> {
  const next: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) next[key] = obj[key];
  }
  return next;
}

/** Single day in a popover. Pass `id` to pair with `FieldLabel`. */
export function DatePicker(props: DatePickerProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    placeholder,
    disabled,
    id,
    className,
    disabledDays,
    startMonth,
    endMonth,
    defaultMonth,
    today,
  } = props;
  const isControlled = "value" in props;
  const messages = useUiMessages();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner;
  const name = placeholder ?? messages.pickDate;

  function select(next: Date | undefined) {
    if (!isControlled) setInner(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          data-slot="date-picker"
          className={cn(triggerClass, !selected && "text-muted-foreground", className)}
        >
          {selected ? formatCalendarDate(selected, messages.locale) : name}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={name} className="w-auto">
        <Calendar
          mode="single"
          onSelect={select}
          {...skipUndef({
            selected,
            disabled: disabledDays,
            startMonth,
            endMonth,
            defaultMonth,
            today,
            footer: selected ? (
              <span role="status">{formatCalendarDate(selected, messages.locale)}</span>
            ) : undefined,
          })}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Start and end day in a popover. Pass `id` to pair with `FieldLabel`. */
export function DateRangePicker(props: DateRangePickerProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    placeholder,
    disabled,
    id,
    className,
    disabledDays,
    startMonth,
    endMonth,
    defaultMonth,
    today,
  } = props;
  const isControlled = "value" in props;
  const messages = useUiMessages();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner;
  const name = placeholder ?? messages.pickDateRange;
  const shown = rangeText(selected, messages.locale, name);

  function select(next: DateRange | undefined) {
    if (!isControlled) setInner(next);
    onValueChange?.(next);
    if (next?.from && next.to && next.from.getTime() !== next.to.getTime()) setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          data-slot="date-range-picker"
          className={cn(triggerClass, !selected?.from && "text-muted-foreground", className)}
        >
          {shown}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={name} className="w-auto">
        <Calendar
          mode="range"
          onSelect={select}
          {...skipUndef({
            selected,
            disabled: disabledDays,
            startMonth,
            endMonth,
            defaultMonth,
            today,
            footer: selected?.from ? <span role="status">{shown}</span> : undefined,
          })}
        />
      </PopoverContent>
    </Popover>
  );
}
