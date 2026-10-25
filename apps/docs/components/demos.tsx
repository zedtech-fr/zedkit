"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  createDataTableColumns,
  DataTable,
  DetailPanel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Heading,
  Input,
  Label,
  LivePulse,
  OptionCards,
  PageHeader,
  SecretField,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Stack,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  WizardSteps,
} from "@zedtech/zedkit-ui";

/**
 * Tested-example previews for the rich doc pages. Each demo renders the
 * REAL workspace component (same import a consumer writes); the docs
 * generator embeds these by manifest key, and the docs check fails if
 * a manifest demo stops existing here.
 */
export function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button>Create app</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="outline">Details</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  );
}

export function BadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>beta</Badge>
      <Badge variant="secondary">12 events</Badge>
      <Badge variant="outline">stable</Badge>
    </div>
  );
}

export function DetailsDemo() {
  return (
    <div className="flex flex-col gap-3">
      <DetailPanel
        items={[
          { label: "Region", value: "eu" },
          { label: "Plan", value: "team" },
        ]}
      />
      <div className="flex gap-4">
        <LivePulse />
        <LivePulse active={false} />
      </div>
    </div>
  );
}

export function InputDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-name">Name</Label>
      <Input id="demo-name" placeholder="Ada" />
    </div>
  );
}

export function SeparatorDemo() {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm">Above</span>
      <Separator />
      <span className="text-sm">Below</span>
      <div className="flex h-6 items-center gap-3">
        <span className="text-sm">Left</span>
        <Separator orientation="vertical" />
        <span className="text-sm">Right</span>
      </div>
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Details</DialogTitle>
        <DialogDescription>A modal dialog rendered from the kit.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialogDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete item</Button>}
      title="Delete item?"
      description="This cannot be undone."
      onConfirm={() => {}}
    />
  );
}

export function SecretFieldDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-key">API key (shown once)</Label>
      <SecretField id="demo-key" value="zk_live_49f2c1" />
    </div>
  );
}

interface DemoRow {
  name: string;
  region: string;
}

const tableHelper = createDataTableColumns<DemoRow>();

export function DataTableDemo() {
  const columns = [
    tableHelper.accessor("name", { header: "Name" }),
    tableHelper.accessor("region", { header: "Region" }),
  ];
  const data: DemoRow[] = [
    { name: "bridge", region: "eu" },
    { name: "console", region: "us" },
    { name: "worker", region: "eu" },
  ];
  return <DataTable columns={columns} data={data} pageSize={5} />;
}

export function AppShellDemo() {
  return (
    <AppShell sidebar={<span className="text-sm">Org nav</span>} topbar={<span className="text-sm">User menu</span>}>
      <PageHeader title="Items" description="All items in this project." />
    </AppShell>
  );
}

export function WizardDemo() {
  const [picked, setPicked] = useState(["a"]);
  return (
    <div className="flex flex-col gap-4">
      <WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
      <OptionCards
        options={[
          { id: "a", title: "Option A", description: "First choice." },
          { id: "b", title: "Option B", description: "Second choice." },
        ]}
        selected={picked}
        onChange={setPicked}
      />
    </div>
  );
}

export function FieldDemo() {
  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldDescription>Public, shown to the team.</FieldDescription>
          <FieldError errors={[{ message: "Too short." }]} />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server</CardTitle>
        <CardDescription>Connection details.</CardDescription>
      </CardHeader>
      <CardContent>Body.</CardContent>
    </Card>
  );
}

export function StackDemo() {
  return (
    <Section title="Team" description="Who can access.">
      <Stack direction="horizontal" gap={2}>
        <Badge>Ada</Badge>
        <Badge variant="secondary">Bo</Badge>
      </Stack>
    </Section>
  );
}

export function TypographyDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Heading level={1}>Page title</Heading>
      <Heading level={2}>Section title</Heading>
      <Text>Body copy.</Text>
      <Text variant="muted">Secondary copy.</Text>
    </div>
  );
}

export function AlertDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something worth knowing.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Failed</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  );
}

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Pick a region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="eu">Europe</SelectItem>
        <SelectItem value="us">Americas</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function TextareaDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-bio">Bio</Label>
      <Textarea id="demo-bio" placeholder="A few words." />
    </div>
  );
}

export function ToggleDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="demo-terms" />
        <Label htmlFor="demo-terms">Accept the terms</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="demo-notify" aria-label="Notify me" />
        <Label htmlFor="demo-notify">Notify me</Label>
      </div>
    </div>
  );
}

export function TabsDemo() {
  return (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">First</TabsTrigger>
        <TabsTrigger value="two">Second</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel.</TabsContent>
      <TabsContent value="two">Second panel.</TabsContent>
    </Tabs>
  );
}
