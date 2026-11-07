"use client";

import { Button, DetailPanel, PageHeader, Stack, StatusDot } from "@zedtech/zedkit-ui";
import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import type { TaskRow } from "@/components/project-tracker-demo-data";
import { byDue, isDone, parseDue, shortDate } from "@/ui/home/home-hero-data";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroApp.team;
const { people } = projectTrackerDemoCopy;

type Person = { name: string; role: string; initials: string; online: boolean };

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export const HERO_PEOPLE: Person[] = (
  [
    [people.maya, copy.roles.maya, true],
    [people.priya, copy.roles.priya, true],
    [people.luca, copy.roles.luca, false],
    [people.tom, copy.roles.tom, true],
    [people.aiko, copy.roles.aiko, true],
  ] as const
).map(([name, role, online]) => ({ name, role, online, initials: initialsOf(name) }));

export const HERO_ONLINE_COUNT = HERO_PEOPLE.filter((person) => person.online).length;

/** A round mark with initials. Its size is fixed in `home-hero.css`: a look's spacing must not resize it. */
export function HeroAvatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      data-hero-avatar=""
      className="flex shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
    >
      {initials}
    </span>
  );
}

function PersonButton({ person, selected, onSelect }: { person: Person; selected: boolean; onSelect: () => void }) {
  return (
    <li className="content-shrink">
      <Button
        type="button"
        variant={selected ? "secondary" : "ghost"}
        aria-pressed={selected}
        className="h-auto min-h-target w-full justify-start gap-stack-md px-control-tight py-select-item-block text-left font-normal"
        onClick={onSelect}
        data-hero-person={person.name}
      >
        <HeroAvatar initials={person.initials} />
        <span className="flex content-shrink flex-1 flex-col">
          <span className="truncate text-dense font-medium">{person.name}</span>
          <span className="truncate text-caption text-muted-foreground">{person.role}</span>
        </span>
        <StatusDot tone={person.online ? "success" : "idle"} pulse={false} />
        <span className="sr-only">{person.online ? copy.online : copy.away}</span>
      </Button>
    </li>
  );
}

export function HeroTeamPage({ rows, selected, onSelect }: { rows: TaskRow[]; selected: string; onSelect: (name: string) => void }) {
  const person = HERO_PEOPLE.find((entry) => entry.name === selected) ?? HERO_PEOPLE[0]!;
  const theirs = rows.filter((row) => row.owner === person.name && !isDone(row)).sort(byDue);
  const next = theirs[0];
  return (
    <Stack gap={3} className="content-shrink">
      <PageHeader titleAs="h2" title={copy.title} description={copy.description} className="trim-bottom" />
      <div data-hero-team-split="" className="grid content-shrink gap-stack-md">
        <ul className="trim-margin flex content-shrink list-none flex-col gap-stack-tight flush" aria-label={copy.title} data-hero-block="" data-beat={1}>
          {HERO_PEOPLE.map((entry) => (
            <PersonButton key={entry.name} person={entry} selected={entry.name === person.name} onSelect={() => onSelect(entry.name)} />
          ))}
        </ul>
        <div className="content-shrink self-start" data-hero-block="" data-beat={2}>
          <DetailPanel
            items={[
              { label: copy.role, value: person.role },
              { label: copy.openTasks, value: <span className="tabular-nums">{theirs.length}</span> },
              { label: copy.nextDue, value: next ? `${shortDate.format(parseDue(next.due))} · ${next.title}` : copy.nothingOpen },
            ]}
          />
        </div>
      </div>
    </Stack>
  );
}
