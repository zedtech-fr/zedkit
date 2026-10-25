import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const CONFIRM_DIALOG_DOC = `${BASE}/docs/ui/confirm-destructive-actions`;

test("confirm-dialog component page exposes catalog a11y and troubleshooting in the DOM", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Accessibility", level: 2 })).toBeVisible();
  await expect(page.getByText(/role="dialog"/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Troubleshooting", level: 2 })).toBeVisible();
  await expect(page.getByText(/onConfirm/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Registry source", level: 2 })).toBeVisible();
  expect(errors).toEqual([]);
});
