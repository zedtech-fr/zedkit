import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersistentShell } from "#index.js";

describe("PersistentShell", () => {
  it("keeps header, sidebar, and dock mounted when only children change", () => {
    const mounts = { header: 0, sidebar: 0, dock: 0, page: 0 };

    function Header() {
      useEffect(() => {
        mounts.header += 1;
      }, []);
      return <p>Header</p>;
    }
    function Sidebar() {
      useEffect(() => {
        mounts.sidebar += 1;
      }, []);
      return <p>Sidebar</p>;
    }
    function Dock() {
      useEffect(() => {
        mounts.dock += 1;
      }, []);
      return <p>Dock</p>;
    }
    function Page({ title }: { title: string }) {
      useEffect(() => {
        mounts.page += 1;
      }, []);
      return <p>{title}</p>;
    }

    const { rerender } = render(
      <PersistentShell header={<Header />} sidebar={<Sidebar />} dock={<Dock />}>
        <Page key="install" title="Install" />
      </PersistentShell>,
    );

    expect(screen.getByText("Install")).not.toBeNull();
    expect(mounts).toEqual({ header: 1, sidebar: 1, dock: 1, page: 1 });

    rerender(
      <PersistentShell header={<Header />} sidebar={<Sidebar />} dock={<Dock />}>
        <Page key="tokens" title="Tokens" />
      </PersistentShell>,
    );

    expect(screen.getByText("Tokens")).not.toBeNull();
    expect(screen.queryByText("Install")).toBeNull();
    expect(mounts).toEqual({ header: 1, sidebar: 1, dock: 1, page: 2 });
  });

  it("mounts chrome again after the shell unmounts", () => {
    let headerMounts = 0;
    function Header() {
      useEffect(() => {
        headerMounts += 1;
      }, []);
      return <p>Header</p>;
    }

    const { unmount } = render(
      <PersistentShell header={<Header />}>
        <p>One</p>
      </PersistentShell>,
    );
    expect(headerMounts).toBe(1);
    unmount();
    render(
      <PersistentShell header={<Header />}>
        <p>Two</p>
      </PersistentShell>,
    );
    expect(headerMounts).toBe(2);
  });

  it("marks the slot host", () => {
    const { container } = render(
      <PersistentShell>
        <p>Page</p>
      </PersistentShell>,
    );
    expect(container.querySelector("[data-slot='persistent-shell']")).not.toBeNull();
  });
});
