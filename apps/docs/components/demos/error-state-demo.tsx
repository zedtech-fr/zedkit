import { ErrorState } from "@zedtech/zedkit-ui";

export function ErrorStateDemo() {
  return (
    <ErrorState
      title="Could not load invoices"
      description="Check your connection and try again."
    />
  );
}
