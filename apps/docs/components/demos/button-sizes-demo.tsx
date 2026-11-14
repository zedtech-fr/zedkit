import { Plus } from "lucide-react";
import { Button, Stack } from "@zedtech/zedkit-ui";
import { buttonCopy } from "@/components/demos/i18n/button-copy";

/** Sizes side by side, asChild link, icon, then the disabled in-flight state. */
export function ButtonSizesDemo() {
  return (
    <Stack gap="lg">
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Button size="sm">{buttonCopy.small}</Button>
        <Button>{buttonCopy.default}</Button>
        <Button size="lg">{buttonCopy.large}</Button>
        <Button size="icon" aria-label={buttonCopy.addItemAriaLabel}>
          <Plus />
        </Button>
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Button variant="secondary">{buttonCopy.cancel}</Button>
        <Button disabled>{buttonCopy.saving}</Button>
        <Button asChild variant="ghost">
          <a href="#usage-and-states">{buttonCopy.docsLink}</a>
        </Button>
      </Stack>
    </Stack>
  );
}
