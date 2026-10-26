"use client";

import { Button, Toaster, toast } from "@zedtech/zedkit-ui";

export function ToasterDemo() {
  return (
    <>
      <Toaster />
      <Button variant="outline" onClick={() => toast("Saved")}>
        Show toast
      </Button>
    </>
  );
}
