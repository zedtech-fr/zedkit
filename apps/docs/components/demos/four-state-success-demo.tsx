import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const rows: Person[] = [
  { name: "Ada", age: 36 },
  { name: "Bob", age: 30 },
];

export function FourStateSuccessDemo() {
  return <DataTable columns={columns} data={rows} />;
}
