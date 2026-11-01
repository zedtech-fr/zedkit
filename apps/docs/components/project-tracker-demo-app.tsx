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

import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import { usePreviewMobile } from "./preview-viewport";

type TaskStatus = (typeof projectTrackerDemoCopy.status)[keyof typeof projectTrackerDemoCopy.status];

interface TaskRow {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  /** ISO date (UTC), formatted on render so the output never depends on the viewer locale. */
  due: string;
}

const STATUS_VARIANT: Record<TaskStatus, BadgeProps["variant"]> = {
  [projectTrackerDemoCopy.status.todo]: "outline",
  [projectTrackerDemoCopy.status.inProgress]: "secondary",
  [projectTrackerDemoCopy.status.inReview]: "warning",
  [projectTrackerDemoCopy.status.blocked]: "destructive",
  [projectTrackerDemoCopy.status.done]: "success",
};

const SEED_TASKS: TaskRow[] = [
  { id: "t-101", title: projectTrackerDemoCopy.tasks.homepageCopy, owner: projectTrackerDemoCopy.people.priya, status: projectTrackerDemoCopy.status.inReview, due: "2026-11-03" },
  {
    id: "t-102",
    title: projectTrackerDemoCopy.tasks.redirectUrls,
    owner: projectTrackerDemoCopy.people.luca,
    status: projectTrackerDemoCopy.status.inProgress,
    due: "2026-11-04",
  },
  { id: "t-103", title: projectTrackerDemoCopy.tasks.heroImages, owner: projectTrackerDemoCopy.people.tom, status: projectTrackerDemoCopy.status.done, due: "2026-10-28" },
  { id: "t-104", title: projectTrackerDemoCopy.tasks.typeface, owner: projectTrackerDemoCopy.people.aiko, status: projectTrackerDemoCopy.status.done, due: "2026-10-26" },
  {
    id: "t-105",
    title: projectTrackerDemoCopy.tasks.contactForm,
    owner: projectTrackerDemoCopy.people.luca,
    status: projectTrackerDemoCopy.status.blocked,
    due: "2026-11-05",
  },
  {
    id: "t-106",
    title: projectTrackerDemoCopy.tasks.checkout,
    owner: projectTrackerDemoCopy.people.maya,
    status: projectTrackerDemoCopy.status.inProgress,
    due: "2026-11-06",
  },
  {
    id: "t-107",
    title: projectTrackerDemoCopy.tasks.pricingFrench,
    owner: projectTrackerDemoCopy.people.priya,
    status: projectTrackerDemoCopy.status.todo,
    due: "2026-11-10",
  },
  { id: "t-108", title: projectTrackerDemoCopy.tasks.analytics, owner: projectTrackerDemoCopy.people.tom, status: projectTrackerDemoCopy.status.todo, due: "2026-11-12" },
  {
    id: "t-109",
    title: projectTrackerDemoCopy.tasks.keyboard,
    owner: projectTrackerDemoCopy.people.aiko,
    status: projectTrackerDemoCopy.status.inReview,
    due: "2026-11-07",
  },
  { id: "t-110", title: projectTrackerDemoCopy.tasks.archiveBlog, owner: projectTrackerDemoCopy.people.maya, status: projectTrackerDemoCopy.status.todo, due: "2026-11-18" },
  { id: "t-111", title: projectTrackerDemoCopy.tasks.launchAnnouncement, owner: projectTrackerDemoCopy.people.priya, status: projectTrackerDemoCopy.status.todo, due: "2026-11-20" },
  { id: "t-112", title: projectTrackerDemoCopy.tasks.a11yCheck, owner: projectTrackerDemoCopy.people.aiko, status: projectTrackerDemoCopy.status.todo, due: "2026-11-24" },
];

const dueFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

const tableHelper = createDataTableColumns<TaskRow>();

const columns = [
  tableHelper.accessor("title", {
    header: projectTrackerDemoCopy.columns.task,
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
    header: projectTrackerDemoCopy.columns.status,
    cell: ({ getValue }) => <Badge variant={STATUS_VARIANT[getValue()]}>{getValue()}</Badge>,
  }),
  tableHelper.accessor("due", {
    header: projectTrackerDemoCopy.columns.due,
    cell: ({ getValue }) => dueFormat.format(new Date(`${getValue()}T00:00:00Z`)),
  }),
];

interface NavItem {
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: projectTrackerDemoCopy.nav.overview, icon: LayoutDashboard },
  { label: projectTrackerDemoCopy.nav.tasks, icon: ListChecks },
  { label: projectTrackerDemoCopy.nav.calendar, icon: CalendarDays },
  { label: projectTrackerDemoCopy.nav.team, icon: Users },
  { label: projectTrackerDemoCopy.nav.settings, icon: Settings },
];

const ACTIVE_ITEM = projectTrackerDemoCopy.nav.tasks;

type PageState = "data" | "loading" | "empty";

const PAGE_STATES: readonly { value: PageState; label: string }[] = [
  { value: "data", label: projectTrackerDemoCopy.pageStates.data },
  { value: "loading", label: projectTrackerDemoCopy.pageStates.loading },
  { value: "empty", label: projectTrackerDemoCopy.pageStates.empty },
];

const MENU_ITEMS: readonly NavItem[] = [
  { label: projectTrackerDemoCopy.menu.profile, icon: UserRound },
  { label: projectTrackerDemoCopy.menu.notifications, icon: Bell },
  { label: projectTrackerDemoCopy.menu.workspace, icon: Repeat },
  { label: projectTrackerDemoCopy.menu.help, icon: CircleHelp },
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
    <nav aria-label={projectTrackerDemoCopy.nav.ariaLabel}>
      <Stack gap={1}>
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const active = label === ACTIVE_ITEM;
          const item = (
            <Button
              type="button"
              variant={active ? "secondary" : "ghost"}
              aria-current={active ? "page" : undefined}
              className="w-full justify-start gap-2"
              onClick={active ? undefined : notice(projectTrackerDemoCopy.nav.unavailable(label))}
            >
              <Icon className="size-4" aria-hidden />
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
    <Stack gap={4} className="h-full p-3">
      <Stack gap={1}>
        <Text className="font-semibold">{projectTrackerDemoCopy.brand}</Text>
        <Text variant="muted" className="text-xs">
          {projectTrackerDemoCopy.product}
        </Text>
      </Stack>
      <ShellNav />
      <Stack gap={2} className="mt-auto">
        <ProgressBar value={62} label={projectTrackerDemoCopy.sprintLabel} />
        <Text variant="muted" className="text-xs">
          {projectTrackerDemoCopy.sprintCaption}
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
        <IconButton label={projectTrackerDemoCopy.openNavigation} variant="ghost" className={mobile ? undefined : "md:hidden"}>
          <Menu className="size-4" aria-hidden />
        </IconButton>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{projectTrackerDemoCopy.brand}</DrawerTitle>
          <DrawerDescription>{projectTrackerDemoCopy.product}</DrawerDescription>
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
        <Button type="button" variant="ghost" className="gap-2 px-2" aria-label={projectTrackerDemoCopy.openUserMenu}>
          <Avatar initials={projectTrackerDemoCopy.initials} />
          <Text as="span" className={cn("text-sm font-medium", mobile ? "hidden" : "max-sm:hidden")}>
            {projectTrackerDemoCopy.people.maya}
          </Text>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <Stack direction="horizontal" gap={3} className="text-left">
            <Avatar initials={projectTrackerDemoCopy.initials} className="size-10 text-sm" />
            <Stack gap={1}>
              <DrawerTitle>{projectTrackerDemoCopy.people.maya}</DrawerTitle>
              <DrawerDescription>{projectTrackerDemoCopy.email}</DrawerDescription>
            </Stack>
          </Stack>
          <Badge variant="secondary" className="w-fit">
            {projectTrackerDemoCopy.role}
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
                  onClick={notice(projectTrackerDemoCopy.menu.unavailable(label))}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Button>
              </DrawerClose>
            ))}
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="gap-2" onClick={notice(projectTrackerDemoCopy.signedOut)}>
              <LogOut className="size-4" aria-hidden />
              {projectTrackerDemoCopy.signOut}
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
        <Text className="text-sm font-medium md:hidden">{projectTrackerDemoCopy.brand}</Text>
      </Stack>
      <Stack direction="horizontal" gap={1}>
        <IconButton label={projectTrackerDemoCopy.notifications} variant="ghost" onClick={notice(projectTrackerDemoCopy.caughtUp)}>
          <Bell className="size-4" aria-hidden />
        </IconButton>
        <UserMenu />
      </Stack>
    </Stack>
  );
}

function Breadcrumbs() {
  return (
    <nav aria-label={projectTrackerDemoCopy.breadcrumbAriaLabel} className="mb-2">
      <Text as="span" variant="muted" className="text-xs">
        {projectTrackerDemoCopy.breadcrumbLead}
        <Text as="span" className="text-xs text-foreground">
          {projectTrackerDemoCopy.nav.tasks}
        </Text>
      </Text>
    </nav>
  );
}

function SummaryCards({ rows }: { rows: TaskRow[] }) {
  const done = rows.filter((row) => row.status === projectTrackerDemoCopy.status.done).length;
  const review = rows.filter((row) => row.status === projectTrackerDemoCopy.status.inReview).length;
  const blocked = rows.filter((row) => row.status === projectTrackerDemoCopy.status.blocked).length;
  const cards = [
    { label: projectTrackerDemoCopy.summary.openTasks, value: String(rows.length - done), note: projectTrackerDemoCopy.summary.blocked(blocked) },
    { label: projectTrackerDemoCopy.summary.waiting, value: String(review), note: projectTrackerDemoCopy.summary.reviewersNotified },
    { label: projectTrackerDemoCopy.summary.completed, value: projectTrackerDemoCopy.summary.completedValue(done, rows.length), note: projectTrackerDemoCopy.summary.sinceStart },
  ];
  return (
    <Card>
      <CardHeader className="p-4">
        <Stack gap={3}>
          {cards.map((card) => (
            <Stack
              key={card.label}
              direction="horizontal"
              gap={3}
              className="items-baseline justify-between"
            >
              <Stack gap={1} className="min-w-0">
                <CardDescription>{card.label}</CardDescription>
                <Text variant="muted" className="text-xs">
                  {card.note}
                </Text>
              </Stack>
              <CardTitle className="text-2xl whitespace-nowrap tabular-nums">{card.value}</CardTitle>
            </Stack>
          ))}
        </Stack>
      </CardHeader>
    </Card>
  );
}

function SummarySkeletons() {
  return <CardSkeleton label={projectTrackerDemoCopy.summary.loading} />;
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
        title: projectTrackerDemoCopy.tasks.nextSprint,
        owner: projectTrackerDemoCopy.people.maya,
        status: projectTrackerDemoCopy.status.todo,
        due: "2026-11-09",
      },
      ...prev,
    ]);
    setState("data");
    toast.success(projectTrackerDemoCopy.taskCreated);
  }

  const loading = state === "loading";
  const tableRows = state === "empty" ? [] : rows;

  return (
    <Stack gap={3} className="w-full min-w-0">
      <Toaster />
      <Stack direction="horizontal" gap={2} className="flex-wrap" role="group" aria-label={projectTrackerDemoCopy.pageState}>
        <Text variant="muted" className="text-xs">
          {projectTrackerDemoCopy.pageState}
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
      <Stack className="h-[min(40rem,80svh)] min-w-0 overflow-hidden rounded-lg border border-border bg-background">
        <AppShell
          className={cn("h-full min-h-0 [&>aside]:w-48", mobile && "[&>aside]:hidden")}
          sidebar={<Sidebar />}
          topbar={<TopBar />}
        >
          <Breadcrumbs />
          <PageHeader
            title={projectTrackerDemoCopy.nav.tasks}
            description={projectTrackerDemoCopy.description}
            actions={
              <>
                <Button type="button" size="sm" variant="outline" className="gap-2" onClick={notice(projectTrackerDemoCopy.exportStarted)}>
                  <Download className="size-4" aria-hidden />
                  {projectTrackerDemoCopy.export}
                </Button>
                <Button type="button" size="sm" className="gap-2" onClick={addTask}>
                  <Plus className="size-4" aria-hidden />
                  {projectTrackerDemoCopy.newTask}
                </Button>
              </>
            }
          />
          <Stack gap={4}>
            {loading ? <SummarySkeletons /> : state === "data" ? <SummaryCards rows={rows} /> : null}
            <Separator />
            <DataTable
              columns={columns}
              data={tableRows}
              loading={loading}
              emptyMessage={projectTrackerDemoCopy.emptyMessage}
              filterPlaceholder={projectTrackerDemoCopy.filterPlaceholder}
              pageSize={6}
            />
          </Stack>
        </AppShell>
      </Stack>
    </Stack>
  );
}
