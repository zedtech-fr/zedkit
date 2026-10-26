"use client";

import { useState } from "react";
import { OptionCards, Stack, Wizard, WizardStep, WizardSteps } from "@zedtech/zedkit-ui";

export function WizardDemo() {
  const [picked, setPicked] = useState(["a"]);
  return (
    <Stack gap={4}>
      <WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
      <Wizard>
        <WizardStep step="Pick" index={0} state="done" showConnector />
        <WizardStep step="Configure" index={1} state="current" />
      </Wizard>
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
