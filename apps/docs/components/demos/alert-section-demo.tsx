import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";

export function AlertSectionDemo() {
  return (
    <Alert asChild>
      <section aria-label="Maintenance notice">
        <AlertTitle>Scheduled maintenance</AlertTitle>
        <AlertDescription>Sunday 02:00–03:00 UTC. Checkout stays available; exports pause.</AlertDescription>
      </section>
    </Alert>
  );
}
