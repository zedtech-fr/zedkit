import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Input,
} from "#index.js";
import { defaultDemoMessages, FormDemo } from "#preview/form-demo.js";

const messages = defaultDemoMessages;

describe("form brick", () => {
  it("shows the localized error with invalid wiring on bad input", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    render(<FormDemo messages={messages} onSave={onSave} />);

    await user.type(screen.getByLabelText(messages.nameLabel), "x");
    await user.click(screen.getByRole("button", { name: messages.save }));

    const input = screen.getByLabelText(messages.nameLabel);
    expect(await screen.findByText(messages.nameTooShort)).not.toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const messageId = screen.getByText(messages.nameTooShort).getAttribute("id") ?? "";
    expect(describedBy.split(" ")).toContain(messageId);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits valid values and toasts success", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    render(<FormDemo messages={messages} onSave={onSave} />);

    await user.type(screen.getByLabelText(messages.nameLabel), "Ada");
    await user.click(screen.getByRole("button", { name: messages.save }));

    expect(await screen.findByText(messages.saved)).not.toBeNull();
    expect(onSave).toHaveBeenCalledWith({ name: "Ada" });
  });

  it("maps a server failure to a field-level error plus toast", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async (): Promise<void> => {
      throw new Error("rejected");
    });
    render(<FormDemo messages={messages} onSave={onSave} />);

    await user.type(screen.getByLabelText(messages.nameLabel), "Ada");
    await user.click(screen.getByRole("button", { name: messages.save }));

    expect(await screen.findAllByText(messages.serverError)).not.toHaveLength(0);
    expect(screen.getByLabelText(messages.nameLabel).getAttribute("aria-invalid")).toBe("true");
  });

  it("disables the submit with a pending label while saving", async () => {
    const user = userEvent.setup();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    render(
      <FormDemo
        messages={messages}
        onSave={() => gate}
      />,
    );

    await user.type(screen.getByLabelText(messages.nameLabel), "Ada");
    await user.click(screen.getByRole("button", { name: messages.save }));

    const pending = (await screen.findByRole("button", { name: messages.saving })) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    release();
    const done = (await screen.findByRole("button", { name: messages.save })) as HTMLButtonElement;
    expect(done.disabled).toBe(false);
  });

  it("renders field layout primitives with error list", () => {
    render(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-demo-name">Name</FieldLabel>
            <FieldDescription>Public display name.</FieldDescription>
            <Input id="field-demo-name" />
            <FieldError errors={[{ message: "First problem." }, { message: "Second problem." }]} />
          </Field>
          <FieldSeparator>or</FieldSeparator>
        </FieldGroup>
      </FieldSet>,
    );
    expect(screen.getByText("First problem.")).not.toBeNull();
    expect(screen.getByText("Second problem.")).not.toBeNull();
    expect(screen.getByRole("alert")).not.toBeNull();
    expect(document.querySelector("[data-slot=field-set]")?.className).toContain("gap-field-set");
  });
});
