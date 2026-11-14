import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InPageAnchorScroll, scrollToFragment } from "#index.js";

function setMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

function fixture(id = "get-started") {
  const target = document.createElement("section");
  target.id = id;
  target.scrollIntoView = vi.fn();
  document.body.append(target);
  const link = document.createElement("a");
  link.href = `#${id}`;
  link.textContent = "Try it yourself";
  document.body.append(link);
  return { target, link };
}

function click(link: HTMLAnchorElement, init?: MouseEventInit) {
  let prevented = false;
  link.addEventListener("click", (event) => {
    prevented = event.defaultPrevented;
  });
  link.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }),
  );
  return () => prevented;
}

describe("InPageAnchorScroll", () => {
  beforeEach(() => {
    setMotion(false);
    document.documentElement.removeAttribute("data-motion");
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-motion");
    document.body.replaceChildren();
    window.history.replaceState(null, "", "/");
  });

  it("scrolls and focuses when the hash is already set", () => {
    window.history.replaceState(null, "", "/#get-started");
    const { target, link } = fixture();
    const pushState = vi.spyOn(history, "pushState");
    const onHash = vi.fn();
    window.addEventListener("hashchange", onHash);
    render(<InPageAnchorScroll />);
    const prevented = click(link);
    expect(prevented()).toBe(true);
    expect(pushState).not.toHaveBeenCalled();
    expect(onHash).not.toHaveBeenCalled();
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(target);
    window.removeEventListener("hashchange", onHash);
  });

  it("pushes the hash then scrolls on a first same-page click", () => {
    const { target, link } = fixture();
    const onHash = vi.fn();
    window.addEventListener("hashchange", onHash);
    render(<InPageAnchorScroll />);
    const prevented = click(link);
    expect(prevented()).toBe(true);
    expect(window.location.hash).toBe("#get-started");
    expect(onHash).toHaveBeenCalledTimes(1);
    expect(onHash.mock.calls[0]?.[0]).toBeInstanceOf(HashChangeEvent);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(target);
    window.removeEventListener("hashchange", onHash);
  });

  it("jumps instantly when data-motion is reduce", () => {
    document.documentElement.setAttribute("data-motion", "reduce");
    const { target, link } = fixture();
    render(<InPageAnchorScroll />);
    click(link);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
  });

  it("jumps instantly when the OS prefers reduced motion", () => {
    setMotion(true);
    const { target, link } = fixture();
    render(<InPageAnchorScroll />);
    click(link);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
  });

  it("leaves modified clicks and non-primary buttons to the browser", () => {
    const { target, link } = fixture();
    render(<InPageAnchorScroll />);
    expect(click(link, { metaKey: true })()).toBe(false);
    expect(click(link, { ctrlKey: true })()).toBe(false);
    expect(click(link, { altKey: true })()).toBe(false);
    expect(click(link, { shiftKey: true })()).toBe(false);
    expect(click(link, { button: 1 })()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("leaves non-_self targets to the browser", () => {
    const { target, link } = fixture();
    link.setAttribute("target", "_blank");
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("leaves a bare hash to the browser", () => {
    const { target } = fixture();
    const link = document.createElement("a");
    link.setAttribute("href", "#");
    document.body.append(link);
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not override an already-prevented click", () => {
    const { target, link } = fixture();
    const stop = (event: Event) => {
      event.preventDefault();
    };
    document.addEventListener("click", stop, true);
    render(<InPageAnchorScroll />);
    click(link);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
    document.removeEventListener("click", stop, true);
  });

  it("leaves other-pathname fragment links to the router", () => {
    window.history.replaceState(null, "", "/docs");
    const { target } = fixture();
    const link = document.createElement("a");
    link.setAttribute("href", "/#get-started");
    document.body.append(link);
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("leaves same-path links with a different query string to the router", () => {
    const { target } = fixture();
    const link = document.createElement("a");
    link.setAttribute("href", "?q=1#get-started");
    document.body.append(link);
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("still intercepts when the query string matches", () => {
    window.history.replaceState(null, "", "/?q=1");
    const { target } = fixture();
    const link = document.createElement("a");
    link.setAttribute("href", "?q=1#get-started");
    document.body.append(link);
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalled();
  });

  it("does not intercept a missing id or a download link", () => {
    const missing = document.createElement("a");
    missing.setAttribute("href", "#no-such-band");
    document.body.append(missing);
    const { target, link } = fixture();
    link.setAttribute("download", "");
    render(<InPageAnchorScroll />);
    expect(click(missing)()).toBe(false);
    expect(click(link)()).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("finds a percent-encoded fragment id", () => {
    const { target } = fixture("déjà");
    const link = document.createElement("a");
    link.setAttribute("href", "#d%C3%A9j%C3%A0");
    document.body.append(link);
    render(<InPageAnchorScroll />);
    expect(click(link)()).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(target);
  });

  it("leaves an existing tabindex and adds -1 when missing", () => {
    const { target, link } = fixture();
    target.tabIndex = 0;
    render(<InPageAnchorScroll />);
    click(link);
    expect(target.tabIndex).toBe(0);
    const other = document.createElement("section");
    other.id = "ai-setup";
    other.scrollIntoView = vi.fn();
    document.body.append(other);
    const otherLink = document.createElement("a");
    otherLink.setAttribute("href", "#ai-setup");
    document.body.append(otherLink);
    click(otherLink);
    expect(other.getAttribute("tabindex")).toBe("-1");
  });

  it("does not stamp tabindex on a natively focusable target", () => {
    const row = document.createElement("a");
    row.id = "issue-1";
    row.href = "#issue-1";
    row.textContent = "Issue 1";
    row.scrollIntoView = vi.fn();
    document.body.append(row);
    render(<InPageAnchorScroll />);
    click(row);
    expect(row.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(row);
    expect(row.scrollIntoView).toHaveBeenCalled();
  });

  it("does not scroll after unmount", () => {
    const { target, link } = fixture();
    const { unmount } = render(<InPageAnchorScroll />);
    unmount();
    click(link);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("scrollToFragment", () => {
  beforeEach(() => {
    setMotion(false);
    document.documentElement.removeAttribute("data-motion");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-motion");
    document.body.replaceChildren();
  });

  it("focuses and smooth-scrolls when motion is allowed", () => {
    const target = document.createElement("section");
    target.id = "get-started";
    target.scrollIntoView = vi.fn();
    document.body.append(target);
    scrollToFragment(target);
    expect(target.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(target);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("does not stamp tabindex on a natively focusable element", () => {
    const target = document.createElement("a");
    target.href = "/issues";
    target.id = "row";
    target.textContent = "Row";
    target.scrollIntoView = vi.fn();
    document.body.append(target);
    scrollToFragment(target);
    expect(target.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(target);
  });
});
