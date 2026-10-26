"use client";

import { useState } from "react";
import { OptionCard, OptionCards, Stack, Wizard, WizardStep, WizardSteps } from "@zedtech/zedkit-ui";

export function WizardDemo() {
  const [picked, setPicked] = useState(["a"]);
  const [solo, setSolo] = useState(false);
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
      <OptionCard title="Solo option" description="Composed directly." checked={solo} onChange={() => setSolo(!solo)} />
    </Stack>
  );
}
