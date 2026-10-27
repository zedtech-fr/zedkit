import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";

/** A store order as a self-contained card: title, who and when, then the lines. */
export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order #1042</CardTitle>
        <CardDescription>Placed 26 October by Camille Rousseau</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Order lines">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Linen shirt</TableCell>
              <TableCell>1</TableCell>
              <TableCell>€49.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Canvas tote</TableCell>
              <TableCell>2</TableCell>
              <TableCell>€48.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Shipping</TableCell>
              <TableCell>1</TableCell>
              <TableCell>€4.50</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Text className="mt-4 font-medium">Total €101.50</Text>
      </CardContent>
    </Card>
  );
}
