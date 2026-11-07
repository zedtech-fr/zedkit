import { Badge } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

const JOBS = badgeCopy.tableRow.jobs;

export function BadgeTableRowDemo() {
  return (
    <table className="w-full content-shrink text-left text-dense">
      <caption className="sr-only">{badgeCopy.tableRow.caption}</caption>
      <thead>
        <tr className="border-b text-muted-foreground">
          <th scope="col" className="py-table-cell pr-column font-medium">{badgeCopy.tableRow.columns.job}</th>
          <th scope="col" className="py-table-cell pr-column font-medium">{badgeCopy.tableRow.columns.target}</th>
          <th scope="col" className="py-table-cell font-medium">{badgeCopy.tableRow.columns.state}</th>
        </tr>
      </thead>
      <tbody>
        {JOBS.map((job) => (
          <tr key={job.name} className="border-b last:border-b-0">
            <td className="py-table-cell pr-column font-medium">{job.name}</td>
            <td className="py-table-cell pr-column">{job.target}</td>
            <td className="py-table-cell">
              <Badge variant={job.state === "done" ? "outline" : "secondary"}>{job.state}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
