import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PromptInput } from "#forms/prompt-input.js";

describe("PromptInput", () => {
  it("leaves the border on the shell, not the field", () => {
    render(
      <PromptInput sendLabel="Generate" value="" onChange={() => {}} onSubmit={() => {}} aria-label="Brief" />,
    );
    const field = screen.getByLabelText("Brief");
    expect(field.className).not.toContain("border-0");
    expect(field.closest("form")?.className).toContain("border-input");
  });

  it("submits on Enter and keeps Shift+Enter as a newline", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Generate"
        value="Hello"
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="Brief"
      />,
    );
    const field = screen.getByLabelText("Brief");
    await user.type(field, "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    onSubmit.mockClear();
    await user.type(field, "{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables send when the value is empty", () => {
    render(
      <PromptInput
        sendLabel="Generate"
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        aria-label="Brief"
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Generate" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("calls onSubmit from the send button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Generate"
        value="Hi"
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="Brief"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps the field editable while sendDisabled blocks Enter and the send button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Generate"
        value="Hi"
        sendDisabled
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="Brief"
      />,
    );
    const field = screen.getByLabelText("Brief") as HTMLTextAreaElement;
    expect(field.disabled).toBe(false);
    expect(
      (screen.getByRole("button", { name: "Generate" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await user.type(field, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uses icon control height on the send button", () => {
    render(
      <PromptInput
        sendLabel="Generate"
        value="Hi"
        onChange={() => {}}
        onSubmit={() => {}}
        aria-label="Brief"
      />,
    );
    const send = screen.getByRole("button", { name: "Generate" });
    expect(send.className).toContain("size-control-height");
    expect(send.className).not.toContain("size-8");
  });

  it("blocks send while busy and exposes aria-busy on the send control", () => {
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Generate"
        value="Hi"
        busy
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="Brief"
      />,
    );
    const send = screen.getByRole("button", { name: "Generate" });
    expect(send.getAttribute("aria-busy")).toBe("true");
    expect((send as HTMLButtonElement).disabled).toBe(true);
  });

  it("submits when allowEmptySubmit is set and the field is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Generate"
        value=""
        allowEmptySubmit
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="Brief"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("applies maxRows as a max-height cap on the field", () => {
    render(
      <PromptInput
        sendLabel="Generate"
        value=""
        maxRows={4}
        onChange={() => {}}
        onSubmit={() => {}}
        aria-label="Brief"
      />,
    );
    const field = screen.getByLabelText("Brief") as HTMLTextAreaElement;
    expect(field.className).toContain("max-h-prompt-input-sm");
    expect(field.className).toContain("overflow-y-auto");
  });

  it("enables Send on the catalog starter default and submits on click", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Send"
        defaultValue="Summarize this page"
        onSubmit={onSubmit}
        placeholder="Ask anything"
        aria-label="Message"
      />,
    );
    const send = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
    expect(send.disabled).toBe(false);
    await user.click(send);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits the catalog starter on Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Send"
        defaultValue="Summarize this page"
        onSubmit={onSubmit}
        placeholder="Ask anything"
        aria-label="Message"
      />,
    );
    await user.type(screen.getByLabelText("Message"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps Shift+Enter as a newline on the catalog starter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Send"
        defaultValue="Summarize this page"
        onSubmit={onSubmit}
        placeholder="Ask anything"
        aria-label="Message"
      />,
    );
    await user.type(screen.getByLabelText("Message"), "{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ignores whitespace-only text on the catalog starter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Send"
        defaultValue="Summarize this page"
        onSubmit={onSubmit}
        placeholder="Ask anything"
        aria-label="Message"
      />,
    );
    const field = screen.getByLabelText("Message");
    const send = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
    await user.clear(field);
    await user.type(field, "   ");
    expect(send.disabled).toBe(true);
    await user.click(send);
    await user.type(field, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("still sends after editing the catalog starter defaultValue", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput
        sendLabel="Send"
        defaultValue="Summarize this page"
        onSubmit={onSubmit}
        placeholder="Ask anything"
        aria-label="Message"
      />,
    );
    const field = screen.getByLabelText("Message");
    const send = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
    await user.clear(field);
    await user.type(field, "Rewrite the heading");
    expect(send.disabled).toBe(false);
    await user.click(send);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
