"use client";

import { Button, Stack, Toaster, toast } from "@zedtech/zedkit-ui";
import { buttonCopy } from "@/components/demos/i18n/button-copy";

export function ButtonDemo() {
  return (
    <>
      <Toaster />
      <Stack id="button-demo" direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Button onClick={() => toast(buttonCopy.created)}>{buttonCopy.createApp}</Button>
        <Button variant="outline" onClick={() => toast(buttonCopy.openedDetails)}>
          {buttonCopy.details}
        </Button>
        <Button variant="ghost" onClick={() => toast(buttonCopy.cancelled)}>
          {buttonCopy.cancel}
        </Button>
        {/* Kit has no outline-destructive; solid destructive is the shipped Delete. The mockup's light+red-text treatment is superseded. */}
        <Button variant="destructive" onClick={() => toast(buttonCopy.deleted)}>
          {buttonCopy.delete}
        </Button>
      </Stack>
    </>
  );
}
