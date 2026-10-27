import { Stack, Text, Wizard, WizardStep } from "@zedtech/zedkit-ui";

export function WizardComposedDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Wizard>
        <WizardStep step="Cart" index={0} state="done" showConnector />
        <WizardStep step="Delivery" index={1} state="done" showConnector />
        <WizardStep step="Payment" index={2} state="current" showConnector />
        <WizardStep step="Confirmation" index={3} state="todo" />
      </Wizard>
      <Text variant="muted">Checkout: payment is the current step; the confirmation comes after.</Text>
    </Stack>
  );
}
