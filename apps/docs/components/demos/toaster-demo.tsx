"use client";

import { Button, Stack, Toaster, toast } from "@zedtech/zedkit-ui";

export function ToasterDemo() {
  return (
    <>
      <Toaster />
      <Stack direction="horizontal" gap={3}>
        <Button variant="outline" onClick={() => toast("Saved")}>
          Show toast
        </Button>
        <Button variant="outline" onClick={() => toast.error("Upload failed")}>
          Show error
        </Button>
      </Stack>
    </>
  );
}
