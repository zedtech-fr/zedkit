import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { RegionSelect, stubSelectJsdom } from "./select-fixture.js";

beforeAll(() => {
  stubSelectJsdom();
});

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
  CardFooter,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  DetailPanel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Heading,
  Input,
  Label,
  LivePulse,
  OptionCards,
  PageHeader,
  SecretField,
  Separator,
  Skeleton,
  Text,
  Toaster,
  WizardSteps,
  createDataTableColumns,
} from "#index.js";
import { FormDemo } from "#preview/form-demo.js";

// Page-level rules (landmarks, document title/lang) belong to the page,
// not to a component in isolation, so they stay out of this suite.
const COMPONENT_AXE_OPTIONS = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

// Note: no toHaveNoViolations matcher — vitest-axe 0.1.0 ships no
// usable matcher types under NodeNext/vitest 2, so assert the
// violations array directly (failures print the full violation).
async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results = await axe(element, COMPONENT_AXE_OPTIONS);
  expect(results.violations).toEqual([]);
}

describe("a11y", () => {
  it("headings and text", async () => {
    const { container } = render(
      <>
        <Heading level={1}>Title</Heading>
        <Heading level={2}>Section</Heading>
        <Text>Body copy.</Text>
        <Text variant="muted">Muted copy.</Text>
      </>,
    );
    await expectNoViolations(container);
  });

  it("button, badge, input+label, separator, skeleton", async () => {
    const { container } = render(
      <>
        <Button>Save</Button>
        <Badge>New</Badge>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
        <Separator />
        <Skeleton />
      </>,
    );
    await expectNoViolations(container);
  });

  it("open dialog", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>Shown in a modal.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await expectNoViolations(document.body);
  });

  it("confirm dialog after opening", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await expectNoViolations(document.body);
  });

  it("toaster region", async () => {
    const { container } = render(<Toaster />);
    await expectNoViolations(container);
  });

  it("open select", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await screen.findByRole("option", { name: "Europe" });
    await expectNoViolations(document.body);
  });

  it("default and destructive alerts", async () => {
    const { container } = render(
      <>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something worth knowing.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      </>,
    );
    await expectNoViolations(container);
  });

  it("secret field", async () => {
    const { container } = render(<SecretField id="key" value="shown-once" aria-label="API key" />);
    await expectNoViolations(container);
  });

  it("data table with rows, and its empty state", async () => {
    const helper = createDataTableColumns<{ name: string }>();
    const columns = [helper.accessor("name", { header: "Name" })];
    const { container, unmount } = render(<DataTable columns={columns} data={[{ name: "Ada" }]} />);
    await expectNoViolations(container);
    unmount();
    const empty = render(<DataTable columns={columns} data={[]} />);
    await expectNoViolations(empty.container);
  });

  it("app shell with header", async () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>} topbar={<div>Top</div>}>
        <PageHeader title="Items" />
      </AppShell>,
    );
    await expectNoViolations(container);
  });

  it("detailPanel", async () => {
    const { container } = render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    await expectNoViolations(container);
  });

  it("card with header, content, and footer", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
          <CardDescription>Connection details.</CardDescription>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    await expectNoViolations(container);
  });

  it("live pulse, idle and active", async () => {
    const { container, unmount } = render(<LivePulse />);
    await expectNoViolations(container);
    unmount();
    const idle = render(<LivePulse active={false} />);
    await expectNoViolations(idle.container);
  });

  it("validated form demo", async () => {
    const { container } = render(<FormDemo />);
    await expectNoViolations(container);
  });

  it("wizard steps and option cards", async () => {
    const { container } = render(
      <>
        <WizardSteps steps={["Pick", "Test"]} current={0} />
        <OptionCards
          options={[{ id: "a", title: "Alpha" }]}
          selected={["a"]}
          onChange={() => {}}
        />
      </>,
    );
    await expectNoViolations(container);
  });
});
