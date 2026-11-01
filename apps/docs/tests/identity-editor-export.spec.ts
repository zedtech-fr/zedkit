import { expect, test } from "@playwright/test";

const PAGE = "/features/identity-editor";

test.describe("identity editor export", () => {
  test("CSS and JSON fields follow a spacing edit", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect(page.getByLabel("CSS", { exact: true })).toHaveValue(/--spacing:\s*0\.4rem/);
    const json = await page.getByLabel("JSON", { exact: true }).inputValue();
    expect(JSON.parse(json) as { spacing: string }).toMatchObject({ spacing: "0.4rem" });
  });

  test("blocks copy until contrast failure is confirmed", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const background = await page.getByLabel("Background", { exact: true }).inputValue();
    await page.getByLabel("Foreground", { exact: true }).fill(background);
    await expect(page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/)).toBeVisible();
    await expect(page.getByText("Copy is blocked until you fix contrast warnings or confirm export.")).toBeVisible();
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Copied CSS")).toHaveCount(0);
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await page.getByRole("button", { name: "Export anyway" }).click();
    await expect(page.getByText("Copied CSS")).toBeVisible();
  });

  test("states what the export is, and loads an export back into every field", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "What this exports" })).toBeVisible();
    await expect(page.getByText(/A recipe, not a complete look/)).toBeVisible();

    const edits: Record<string, string> = {
      Spacing: "0.31rem",
      "Border width": "2px",
      Radius: "0.75rem",
      "Line height": "1.7",
      "Heading line height": "1.2",
      "Letter spacing": "-0.03em",
      "Label spacing": "0.1em",
      Shadow: "0 1px 2px 0 rgb(0 0 0 / 0.2)",
      "Large shadow": "0 6px 8px -2px rgb(0 0 0 / 0.2)",
      Background: "10 40% 94%",
      Foreground: "10 30% 12%",
      Primary: "200 60% 30%",
      "Primary text": "0 0% 99%",
      Accent: "20 80% 40%",
      Border: "30 20% 40%",
      "Muted text": "30 10% 30%",
    };
    for (const [label, value] of Object.entries(edits)) await page.getByLabel(label, { exact: true }).fill(value);
    const exported = await page.getByLabel("JSON", { exact: true }).inputValue();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
    await page.getByLabel("Pasted recipe").fill(exported);
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByText("Recipe loaded into the draft.")).toBeVisible();
    for (const [label, value] of Object.entries(edits)) await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
    await expect(page.getByLabel("JSON", { exact: true })).toHaveValue(exported);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
  });

  test("a recipe that cannot be loaded says why and leaves the draft alone", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Pasted recipe").fill("{ nope");
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not valid JSON" })).toBeVisible();
    const json = JSON.parse(await page.getByLabel("JSON", { exact: true }).inputValue()) as Record<string, unknown>;
    await page.getByLabel("Pasted recipe").fill(JSON.stringify({ ...json, radius: undefined }));
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "radius" })).toBeVisible();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
  });
});
