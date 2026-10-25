"use client";

import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";

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
