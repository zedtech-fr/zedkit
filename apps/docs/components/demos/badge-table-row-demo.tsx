import { Badge } from "@zedtech/zedkit-ui";

const JOBS = [
  { name: "sync", target: "Product catalogue", state: "queued" },
  { name: "export", target: "Orders, October", state: "running" },
  { name: "backup", target: "Customer files", state: "done" },
];

export function BadgeTableRowDemo() {
  return (
    <table className="w-full min-w-0 text-left text-sm">
      <caption className="sr-only">Background jobs</caption>
      <thead>
        <tr className="border-b text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">Job</th>
          <th scope="col" className="py-2 pr-4 font-medium">Target</th>
          <th scope="col" className="py-2 font-medium">State</th>
        </tr>
      </thead>
      <tbody>
        {JOBS.map((job) => (
          <tr key={job.name} className="border-b last:border-b-0">
            <td className="py-2 pr-4 font-medium">{job.name}</td>
            <td className="py-2 pr-4">{job.target}</td>
            <td className="py-2">
              <Badge variant={job.state === "done" ? "outline" : "secondary"}>{job.state}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
