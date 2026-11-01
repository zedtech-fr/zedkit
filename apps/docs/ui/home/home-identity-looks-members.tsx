import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zedtech/zedkit-ui";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const copy = homeIdentityLooksCopy.stage;

export function HomeIdentityLooksMembers() {
  return (
    <Table aria-label={copy.tableAriaLabel}>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.columns.member}</TableHead>
          <TableHead>{copy.columns.role}</TableHead>
          <TableHead>{copy.columns.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {copy.rows.map((row) => (
          <TableRow key={row.member}>
            <TableCell>{row.member}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge variant={row.tone}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
