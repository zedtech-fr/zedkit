"use client";

import { useId, useState } from "react";
import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import { roleForExportSymbol } from "@/lib/import-symbols";

export function ComponentExportsPanel({ symbols, wraps }: { symbols: string[]; wraps: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <Stack gap={2}>
      <Button type="button" variant="ghost" size="sm" className="w-fit"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}>
        {open ? "Hide export symbols" : "Show export symbols"}
      </Button>
      {open ? (
        <Stack gap={3} id={panelId}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((name) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-xs">{name}</TableCell>
                  <TableCell className="text-muted-foreground">{roleForExportSymbol(name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Text variant="muted">Wraps: {wraps}</Text>
        </Stack>
      ) : (
        <Text variant="muted" className="text-xs">
          {symbols.length} symbols from this import. Wraps: {wraps}
        </Text>
      )}
    </Stack>
  );
}
