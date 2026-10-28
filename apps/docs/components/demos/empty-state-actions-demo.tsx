import { Button, EmptyState } from "@zedtech/zedkit-ui";

export function EmptyStateActionsDemo() {
  return (
    <EmptyState
      title="No invoices"
      description="Create an invoice to send to a client."
      actions={<Button>New invoice</Button>}
    />
  );
}
