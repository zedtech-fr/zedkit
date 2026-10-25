import { Alert, AlertDescription, AlertTitle, Stack } from "@zedtech/zedkit-ui";

export function AlertDemo() {
  return (
    <Stack gap={2}>
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something worth knowing.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Failed</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </Stack>
  );
}
