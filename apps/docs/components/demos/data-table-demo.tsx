"use client";

import { useState } from "react";
import { DataTable, DataTablePagination, Stack, createDataTableColumns } from "@zedtech/zedkit-ui";

interface DemoRow {
  name: string;
  region: string;
}

const tableHelper = createDataTableColumns<DemoRow>();

export function DataTableDemo() {
  const [page, setPage] = useState(2);
  const columns = [
    tableHelper.accessor("name", { header: "Name" }),
    tableHelper.accessor("region", { header: "Region" }),
  ];
  const data: DemoRow[] = [
    { name: "bridge", region: "eu" },
    { name: "console", region: "us" },
    { name: "worker", region: "eu" },
  ];
  return (
    <Stack gap={4}>
      <DataTable columns={columns} data={data} pageSize={5} />
      <DataTablePagination
        page={page}
        pageCount={4}
        canPrevious={page > 1}
        canNext={page < 4}
        onPrevious={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </Stack>
  );
}
