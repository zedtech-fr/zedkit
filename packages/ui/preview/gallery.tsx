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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Text,
  Toaster,
  WizardSteps,
  createDataTableColumns,
} from "#index.js";
import { FormDemo } from "./form-demo.js";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const rows: Person[] = [
  { name: "Ada", age: 36 },
  { name: "Bob", age: 30 },
  { name: "Cara", age: 28 },
];

const SECTIONS = [
  ["primitives", "Primitives"],
  ["overlays", "Overlays"],
  ["data-table", "Data table"],
  ["layout", "Layout"],
  ["wizard", "Wizard"],
  ["forms", "Forms"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 border-b pb-8 last:border-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  return (
    <AppShell
      sidebar={
        <nav className="space-y-1 p-4" aria-label="Gallery sections">
          <p className="px-2 pb-2 text-sm font-semibold">UI gallery</p>
          {SECTIONS.map(([id, title]) => (
            <a key={id} href={`#${id}`} className="block rounded-md px-2 py-1 text-sm hover:bg-accent">
              {title}
            </a>
          ))}
        </nav>
      }
      topbar={
        <div className="flex items-center justify-between p-4">
          <p className="text-sm font-medium">Component gallery (static preview)</p>
          <LivePulse />
        </div>
      }
    >
      <PageHeader
        title="UI gallery"
        description="Every component in every state. Static render for visual review; behavior is covered by unit tests."
      />
      <div className="space-y-8">
        <Section id="primitives" title="Primitives">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="gallery-name">Name</Label>
            <Input id="gallery-name" placeholder="Ada" />
          </div>
          <Separator />
          <Skeleton className="h-4 w-48" />
          <div className="space-y-2">
            <Heading level={1}>Page title</Heading>
            <Heading level={2}>Section title</Heading>
            <Text>Body copy for paragraphs.</Text>
            <Text variant="muted">Muted secondary copy.</Text>
          </div>
        </Section>

        <Section id="overlays" title="Overlays">
          {/* Closed on purpose: an open modal would dim the whole
              review surface. Open behavior is covered by unit tests. */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Details</DialogTitle>
              <DialogDescription>Dialog content.</DialogDescription>
            </DialogContent>
          </Dialog>
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete</Button>}
            title="Delete item?"
            description="This cannot be undone."
            onConfirm={() => {}}
          />
          <SecretField id="gallery-key" value="shown-once-value" aria-label="API key" />
          <Alert className="max-w-sm">
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>Something worth knowing.</AlertDescription>
          </Alert>
          <Alert variant="destructive" className="max-w-sm">
            <AlertTitle>Failed</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
          <Toaster />
        </Section>

        <Section id="data-table" title="Data table">
          <h3 className="text-sm font-medium text-muted-foreground">With rows</h3>
          <DataTable columns={columns} data={rows} pageSize={2} />
          <h3 className="text-sm font-medium text-muted-foreground">Empty</h3>
          <DataTable columns={columns} data={[]} />
          <h3 className="text-sm font-medium text-muted-foreground">Loading</h3>
          <DataTable columns={columns} data={[]} loading />
          <h3 className="text-sm font-medium text-muted-foreground">Error</h3>
          <DataTable columns={columns} data={[]} error="Could not load rows." />
        </Section>

        <Section id="layout" title="Layout">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Server</CardTitle>
              <CardDescription>Connection details.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Body text.</p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Footer text.</p>
            </CardFooter>
          </Card>
          <DetailPanel
            items={[
              { label: "Name", value: "Ada" },
              { label: "Region", value: "eu" },
            ]}
          />
          <div className="flex gap-4">
            <LivePulse />
            <LivePulse active={false} />
          </div>
        </Section>

        <Section id="forms" title="Forms">
          <FormDemo />
          <Select>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Pick a region" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Regions</SelectLabel>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="us">Americas</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Section>

        <Section id="wizard" title="Wizard">
          <WizardSteps steps={["Pick", "Configure", "Test"]} current={1} />
          <OptionCards
            options={[
              { id: "a", title: "Alpha", description: "First option." },
              { id: "b", title: "Beta", description: "Second option." },
            ]}
            selected={["a"]}
            onChange={() => {}}
          />
        </Section>
      </div>
    </AppShell>
  );
}
