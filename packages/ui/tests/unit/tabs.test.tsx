import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#index.js";

function DemoTabs() {
  return (
    <Tabs defaultValue="one">
      <TabsList aria-label="Demo">
        <TabsTrigger value="one">First</TabsTrigger>
        <TabsTrigger value="two">Second</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel.</TabsContent>
      <TabsContent value="two">Second panel.</TabsContent>
    </Tabs>
  );
}

describe("tabs", () => {
  it("shows the default panel, then switches on trigger click", async () => {
    const user = userEvent.setup();
    render(<DemoTabs />);

    expect(screen.getByText("First panel.")).not.toBeNull();
    expect(screen.queryByText("Second panel.")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(await screen.findByText("Second panel.")).not.toBeNull();
    expect(screen.getByRole("tab", { name: "Second" }).getAttribute("data-state")).toBe("active");
  });
});
