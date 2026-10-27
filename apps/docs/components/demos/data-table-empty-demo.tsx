import {
  DataTableEmpty,
  Stack,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";

/** No-results row inside your own table body, with a sentence that says what to do next. */
export function DataTableEmptyDemo() {
  return (
    <Stack gap={3}>
      <Text variant="muted">Search: “gift card”</Text>
      <Table aria-label="Search results">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <DataTableEmpty colSpan={3} message="No product matches “gift card”. Check the spelling or clear the search." />
        </TableBody>
      </Table>
    </Stack>
  );
}
