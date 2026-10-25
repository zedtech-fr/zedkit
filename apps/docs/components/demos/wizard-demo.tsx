"use client";

import { useState } from "react";
import { OptionCards, Stack, WizardSteps } from "@zedtech/zedkit-ui";

export function WizardDemo() {
  const [picked, setPicked] = useState(["a"]);
  return (
    <Stack gap={4}>
      <WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
      <OptionCards
        options={[
          { id: "a", title: "Option A", description: "First choice." },
          { id: "b", title: "Option B", description: "Second choice." },
        ]}
        selected={picked}
        onChange={setPicked}
      />
    </Stack>
  );
}
