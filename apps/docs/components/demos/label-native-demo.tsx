import { Label, Stack } from "@zedtech/zedkit-ui";
import { labelCopy } from "@/components/demos/i18n/label-copy";

/** Label needs no other kit component: a native input with a matching id is enough. */
export function LabelNativeDemo() {
  return (
    <Stack gap="sm">
      <Label htmlFor="label-city">{labelCopy.native.city}</Label>
      <input
        id="label-city"
        placeholder={labelCopy.native.placeholder}
        className="rounded-md border border-border bg-background px-field-pad py-control-block-lg text-foreground"
      />
    </Stack>
  );
}
