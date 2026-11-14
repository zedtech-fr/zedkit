import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageTransition, type PageTransitionPreset } from "#index.js";

function Article({ title }: { title: string }) {
  return <p>{title}</p>;
}

function MountCounter({ title, onMount }: { title: string; onMount: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);
  return <p>{title}</p>;
}

describe("PageTransition", () => {
  it("remounts inner content when routeKey changes", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };

    const { rerender } = render(
      <PageTransition routeKey="/docs/install">
        <MountCounter title="Install" onMount={onMount} />
      </PageTransition>,
    );
    expect(screen.getByText("Install")).not.toBeNull();
    expect(mounts).toBe(1);

    rerender(
      <PageTransition routeKey="/docs/tokens">
        <MountCounter title="Tokens" onMount={onMount} />
      </PageTransition>,
    );
    expect(screen.getByText("Tokens")).not.toBeNull();
    expect(screen.queryByText("Install")).toBeNull();
    expect(mounts).toBe(2);

    rerender(
      <PageTransition routeKey="/docs/tokens">
        <MountCounter title="Tokens" onMount={onMount} />
      </PageTransition>,
    );
    expect(mounts).toBe(2);
  });

  it("does not remount inner content when routeKey is omitted", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };

    const { rerender } = render(
      <PageTransition>
        <MountCounter title="Install" onMount={onMount} />
      </PageTransition>,
    );
    expect(mounts).toBe(1);
    rerender(
      <PageTransition>
        <MountCounter title="Tokens" onMount={onMount} />
      </PageTransition>,
    );
    expect(screen.getByText("Tokens")).not.toBeNull();
    expect(mounts).toBe(1);
  });

  it("plays settle by default and reveal when asked", () => {
    const { container, rerender } = render(
      <PageTransition>
        <Article title="Install" />
      </PageTransition>,
    );
    const host = container.querySelector("[data-slot='page-transition']");
    expect(host).not.toBeNull();
    expect(host?.querySelector(".motion-settle")).not.toBeNull();
    expect(host?.querySelector(".motion-reveal")).toBeNull();

    rerender(
      <PageTransition preset="reveal">
        <Article title="Install" />
      </PageTransition>,
    );
    expect(container.querySelector(".motion-reveal")).not.toBeNull();
    expect(container.querySelector(".motion-settle")).toBeNull();
  });

  it("falls back to settle for an unknown preset", () => {
    const { container } = render(
      <PageTransition preset={"zoom" as PageTransitionPreset}>
        <Article title="Install" />
      </PageTransition>,
    );
    expect(container.querySelector(".motion-settle")).not.toBeNull();
    expect(container.querySelector(".motion-reveal")).toBeNull();
  });

  it("leaves content visible when motion is reduced", () => {
    document.documentElement.dataset.motion = "reduce";
    const { container } = render(
      <PageTransition preset="reveal">
        <Article title="Install" />
      </PageTransition>,
    );
    expect(screen.getByText("Install")).not.toBeNull();
    expect(container.querySelector("[data-slot='page-transition']")).not.toBeNull();
    document.documentElement.removeAttribute("data-motion");
  });

  it("remounts on each successive routeKey", () => {
    let mounts = 0;
    const onMount = () => {
      mounts += 1;
    };
    const { rerender } = render(
      <PageTransition routeKey="/a">
        <MountCounter title="A" onMount={onMount} />
      </PageTransition>,
    );
    rerender(
      <PageTransition routeKey="/b">
        <MountCounter title="B" onMount={onMount} />
      </PageTransition>,
    );
    rerender(
      <PageTransition routeKey="/c">
        <MountCounter title="C" onMount={onMount} />
      </PageTransition>,
    );
    expect(mounts).toBe(3);
  });
});
