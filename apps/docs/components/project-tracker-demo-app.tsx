"use client";

import {
  Bell,
  CalendarDays,
  CircleHelp,
  Download,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  Repeat,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardSkeleton,
  CardTitle,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
  PageHeader,
  ProgressBar,
  Separator,
  Stack,
  Text,
  Toaster,
  cn,
  createDataTableColumns,
  toast,
  type BadgeProps,
} from "@zedtech/zedkit-ui";

import { usePreviewMobile } from "./preview-viewport";

type TaskStatus = "To do" | "In progress" | "In review" | "Blocked" | "Done";

interface TaskRow {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  /** ISO date (UTC), formatted on render so the output never depends on the viewer locale. */
  due: string;
}

const STATUS_VARIANT: Record<TaskStatus, BadgeProps["variant"]> = {
  "To do": "outline",
  "In progress": "secondary",
  "In review": "warning",
  Blocked: "destructive",
  Done: "success",
};

const SEED_TASKS: TaskRow[] = [
  { id: "t-101", title: "Write the homepage copy", owner: "Priya Nair", status: "In review", due: "2026-11-03" },
  {
    id: "t-102",
    title: "Redirect the old product URLs",
    owner: "Luca Moretti",
    status: "In progress",
    due: "2026-11-04",
  },
  { id: "t-103", title: "Compress and resize hero images", owner: "Tom Becker", status: "Done", due: "2026-10-28" },
  { id: "t-104", title: "Choose the new typeface pairing", owner: "Aiko Tanaka", status: "Done", due: "2026-10-26" },
  {
    id: "t-105",
    title: "Connect the contact form to email",
    owner: "Luca Moretti",
    status: "Blocked",
    due: "2026-11-05",
  },
  {
    id: "t-106",
    title: "Review the checkout flow on phones",
    owner: "Maya Chen",
    status: "In progress",
    due: "2026-11-06",
  },
  {
    id: "t-107",
    title: "Translate the pricing page to French",
    owner: "Priya Nair",
    status: "To do",
    due: "2026-11-10",
  },
  { id: "t-108", title: "Set up the analytics dashboard", owner: "Tom Becker", status: "To do", due: "2026-11-12" },
  {
    id: "t-109",
    title: "Test keyboard navigation on every page",
    owner: "Aiko Tanaka",
    status: "In review",
    due: "2026-11-07",
  },
  { id: "t-110", title: "Archive the 2024 blog posts", owner: "Maya Chen", status: "To do", due: "2026-11-18" },
  { id: "t-111", title: "Write the launch announcement", owner: "Priya Nair", status: "To do", due: "2026-11-20" },
  { id: "t-112", title: "Run the final accessibility check", owner: "Aiko Tanaka", status: "To do", due: "2026-11-24" },
];

const dueFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

const tableHelper = createDataTableColumns<TaskRow>();

const columns = [
  tableHelper.accessor("title", {
    header: "Task",
    cell: ({ row }) => (
      <Stack gap={1} className="min-w-0">
        <Text className="font-medium">{row.original.title}</Text>
        <Text variant="muted" className="text-xs">
          {row.original.owner}
        </Text>
      </Stack>
    ),
  }),
  tableHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <Badge variant={STATUS_VARIANT[getValue()]}>{getValue()}</Badge>,
  }),
  tableHelper.accessor("due", {
    header: "Due",
    cell: ({ getValue }) => dueFormat.format(new Date(`${getValue()}T00:00:00Z`)),
  }),
];

interface NavItem {
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Tasks", icon: ListChecks },
  { label: "Calendar", icon: CalendarDays },
  { label: "Team", icon: Users },
  { label: "Settings", icon: Settings },
];

const ACTIVE_ITEM = "Tasks";

type PageState = "data" | "loading" | "empty";

const PAGE_STATES: readonly { value: PageState; label: string }[] = [
  { value: "data", label: "With data" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
];

const MENU_ITEMS: readonly NavItem[] = [
  { label: "Your profile", icon: UserRound },
  { label: "Notification settings", icon: Bell },
  { label: "Switch workspace", icon: Repeat },
  { label: "Help and shortcuts", icon: CircleHelp },
];

function notice(message: string) {
  return () => toast(message);
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <Text
      as="span"
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
    >
      {initials}
    </Text>
  );
}

function ShellNav({ wrap }: { wrap?: (item: ReactNode) => ReactNode }) {
  return (
    <nav aria-label="Main">
      <Stack gap={1}>
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const active = label === ACTIVE_ITEM;
          const item = (
            <Button
              type="button"
              variant={active ? "secondary" : "ghost"}
              aria-current={active ? "page" : undefined}
              className="w-full justify-start gap-2"
              onClick={active ? undefined : notice(`${label} is not part of this example. Tasks has the full screen.`)}
            >
              <Icon className="size-icon-control" aria-hidden />
              {label}
            </Button>
          );
          return <Stack key={label}>{wrap ? wrap(item) : item}</Stack>;
        })}
      </Stack>
    </nav>
  );
}

function Sidebar() {
  return (
    <Stack gap={6} className="h-full p-4">
      <Stack gap={1}>
        <Text className="font-semibold">Harbor Studio</Text>
        <Text variant="muted" className="text-xs">
          Project tracker
        </Text>
      </Stack>
      <ShellNav />
      <Stack gap={2} className="mt-auto">
        <ProgressBar value={62} label="Sprint 14 progress" />
        <Text variant="muted" className="text-xs">
          Sprint 14 · 62% done · 5 days left
        </Text>
      </Stack>
    </Stack>
  );
}

function MobileNav() {
  const mobile = usePreviewMobile();
  return (
    <Drawer direction="left" mobile="side">
      <DrawerTrigger asChild>
        <IconButton label="Open navigation" variant="ghost" className={mobile ? undefined : "md:hidden"}>
          <Menu className="size-icon-control" aria-hidden />
        </IconButton>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>Harbor Studio</DrawerTitle>
          <DrawerDescription>Project tracker</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <ShellNav wrap={(item) => <DrawerClose asChild>{item}</DrawerClose>} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function UserMenu() {
  const mobile = usePreviewMobile();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="ghost" className="gap-2 px-2" aria-label="Open user menu">
          <Avatar initials="MC" />
          <Text as="span" className={cn("text-sm font-medium", mobile ? "hidden" : "max-sm:hidden")}>
            Maya Chen
          </Text>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <Stack direction="horizontal" gap={3} className="text-left">
            <Avatar initials="MC" className="size-10 text-sm" />
            <Stack gap={1}>
              <DrawerTitle>Maya Chen</DrawerTitle>
              <DrawerDescription>maya.chen@example.com</DrawerDescription>
            </Stack>
          </Stack>
          <Badge variant="secondary" className="w-fit">
            Project manager
          </Badge>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={1} className="py-2">
            {MENU_ITEMS.map(({ label, icon: Icon }) => (
              <DrawerClose asChild key={label}>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={notice(`${label} is not part of this example.`)}
                >
                  <Icon className="size-icon-control" aria-hidden />
                  {label}
                </Button>
              </DrawerClose>
            ))}
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="gap-2" onClick={notice("Signed out (example only)")}>
              <LogOut className="size-icon-control" aria-hidden />
              Sign out
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function TopBar() {
  return (
    <Stack direction="horizontal" gap={2} className="justify-between px-4 py-2">
      <Stack direction="horizontal" gap={2}>
        <MobileNav />
        <Text className="text-sm font-medium md:hidden">Harbor Studio</Text>
      </Stack>
      <Stack direction="horizontal" gap={1}>
        <IconButton label="Notifications" variant="ghost" onClick={notice("You are all caught up.")}>
          <Bell className="size-icon-control" aria-hidden />
        </IconButton>
        <UserMenu />
      </Stack>
    </Stack>
  );
}

function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <Text as="span" variant="muted" className="text-xs">
        Projects / Website relaunch /{" "}
        <Text as="span" className="text-xs text-foreground">
          Tasks
        </Text>
      </Text>
    </nav>
  );
}

function SummaryCards({ rows }: { rows: TaskRow[] }) {
  const done = rows.filter((row) => row.status === "Done").length;
  const review = rows.filter((row) => row.status === "In review").length;
  const blocked = rows.filter((row) => row.status === "Blocked").length;
  const cards = [
    { label: "Open tasks", value: String(rows.length - done), note: `${blocked} blocked` },
    { label: "Waiting for review", value: String(review), note: "Reviewers were notified" },
    { label: "Completed", value: `${done} of ${rows.length}`, note: "Since the project started" },
  ];
  return (
    <Stack direction="horizontal" gap={4} className="flex-wrap items-stretch">
      {cards.map((card) => (
        <Card key={card.label} className="min-w-40 flex-1">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="muted" className="text-xs">
              {card.note}
            </Text>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function SummarySkeletons() {
  return (
    <Stack direction="horizontal" gap={4} className="flex-wrap items-stretch">
      {[0, 1, 2].map((index) => (
        <CardSkeleton key={index} label="Loading summary" className="min-w-40 flex-1" />
      ))}
    </Stack>
  );
}

/**
 * A complete app screen built on AppShell: sidebar and drawer navigation, top bar
 * with a user menu, breadcrumbs, page header with actions, summary cards and a
 * sortable task table. The preview switch shows the loading and empty states.
 */
export function ProjectTrackerDemoApp() {
  const mobile = usePreviewMobile();
  const [rows, setRows] = useState<TaskRow[]>(SEED_TASKS);
  const [state, setState] = useState<PageState>("data");

  function addTask() {
    setRows((prev) => [
      {
        id: `t-${200 + prev.length}`,
        title: "Plan the next sprint review",
        owner: "Maya Chen",
        status: "To do",
        due: "2026-11-09",
      },
      ...prev,
    ]);
    setState("data");
    toast.success("Task created");
  }

  const loading = state === "loading";
  const tableRows = state === "empty" ? [] : rows;

  return (
    <Stack gap={3} className="w-full min-w-0">
      <Toaster />
      <Stack direction="horizontal" gap={2} className="flex-wrap" role="group" aria-label="Page state">
        <Text variant="muted" className="text-xs">
          Page state
        </Text>
        {PAGE_STATES.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            size="sm"
            variant={entry.value === state ? "default" : "outline"}
            aria-pressed={entry.value === state}
            onClick={() => setState(entry.value)}
          >
            {entry.label}
          </Button>
        ))}
      </Stack>
      <Stack className="h-[min(40rem,80svh)] min-w-0 overflow-y-auto rounded-lg border border-border bg-background">
        <AppShell
          className={cn("min-h-0", mobile && "[&>aside]:hidden")}
          sidebar={<Sidebar />}
          topbar={<TopBar />}
        >
          <Breadcrumbs />
          <PageHeader
            title="Tasks"
            description="Website relaunch · everything the team has to ship before the launch on November 25."
            actions={
              <>
                <Button type="button" variant="outline" className="gap-2" onClick={notice("Export started: tasks.csv")}>
                  <Download className="size-icon-control" aria-hidden />
                  Export
                </Button>
                <Button type="button" className="gap-2" onClick={addTask}>
                  <Plus className="size-icon-control" aria-hidden />
                  New task
                </Button>
              </>
            }
          />
          <Stack gap={6}>
            {loading ? <SummarySkeletons /> : state === "data" ? <SummaryCards rows={rows} /> : null}
            <Separator />
            <DataTable
              columns={columns}
              data={tableRows}
              loading={loading}
              emptyMessage="No tasks yet. Select New task to add the first one."
              filterPlaceholder="Filter tasks…"
              pageSize={6}
            />
          </Stack>
        </AppShell>
      </Stack>
    </Stack>
  );
}
