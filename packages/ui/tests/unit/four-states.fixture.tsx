import { Button, DataTable, EmptyState, ErrorState, Spinner, Stack, Text, createDataTableColumns } from "#index.js";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const rows: Person[] = [
  { name: "Ada", age: 36 },
  { name: "Bob", age: 30 },
];

export function FourStateLoading() {
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <Spinner label="Loading invoices" />
      <Text>Loading invoices</Text>
    </Stack>
  );
}

export function FourStateEmpty() {
  return (
    <EmptyState
      title="No invoices"
      description="Create an invoice to send to a client."
      actions={<Button>New invoice</Button>}
    />
  );
}

export function FourStateError() {
  return (
    <ErrorState
      title="Could not load invoices"
      description="Check your connection and try again."
      actions={<Button variant="outline">Try again</Button>}
    />
  );
}

export function FourStateSuccess() {
  return <DataTable columns={columns} data={rows} />;
}
