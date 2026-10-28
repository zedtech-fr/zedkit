import { Calendar } from "@zedtech/zedkit-ui";

export function CalendarDemo() {
  return <Calendar defaultMonth={new Date(2026, 9, 1)} today={new Date(2026, 9, 15)} />;
}
