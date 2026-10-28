import { Button, ErrorState } from "@zedtech/zedkit-ui";

export function FourStateErrorDemo() {
  return (
    <ErrorState
      title="Could not load invoices"
      description="Check your connection and try again."
      actions={<Button variant="outline">Try again</Button>}
    />
  );
}
