"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { GithubIcon } from "@/ui/github-icon";
import { useTheme } from "next-themes";
import { useSidebar } from "fumadocs-ui/components/sidebar/base";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  IdentityPicker,
} from "@zedtech/zedkit-ui";
import { SearchPill } from "@/ui/search-pill";
import { SiteBrand } from "@/ui/site-brand";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";

const iconButtonClassName =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

type MobileLink = { text: string; href: string; external?: boolean };

const noop = () => () => {};

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={iconButtonClassName}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Moon aria-hidden="true" className="size-icon-control" /> : <Sun aria-hidden="true" className="size-icon-control" />}
    </button>
  );
}

function DocsMenuButton() {
  const sidebar = useSidebar();
  return (
    <button type="button" aria-label="Open navigation" className={iconButtonClassName} onClick={() => sidebar.setOpen(true)}>
      <Menu aria-hidden="true" className="size-icon-control" />
    </button>
  );
}

function HomeMenuButton({ links }: { links: MobileLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label="Open menu" aria-haspopup="dialog" className={iconButtonClassName} onClick={() => setOpen(true)}>
        <Menu aria-hidden="true" className="size-icon-control" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription>Where to go next.</DrawerDescription>
          </DrawerHeader>
          <nav aria-label="Menu" className="flex flex-col gap-1 px-4 pb-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-foreground focus-ring-control hover:bg-muted"
                {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/**
 * Phone header (< md): the logo and name at the left, the identity chooser in the
 * middle, the rest grouped at the right; search is a floating button.
 */
export function MobileHeader({
  mode,
  links,
  className,
}: {
  mode: "home" | "docs";
  links: MobileLink[];
  className?: string;
}) {
  return (
    <>
      <header
        id="nd-mobile-nav"
        className={
          className ??
          "sticky top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b bg-background px-2 md:hidden"
        }
      >
        <Link href="/" aria-label="zedkit home" className={`${iconButtonClassName} justify-self-start text-foreground`}>
          <span className="flex items-center gap-2 px-1 font-semibold">
            <SiteBrand />
          </span>
        </Link>
        <IdentityPicker defaultIdentity={DEFAULT_IDENTITY} />
        <div className="flex items-center justify-self-end">
          <ThemeButton />
          <a href={SITE_GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className={iconButtonClassName}>
            <GithubIcon className="size-icon-control" />
          </a>
          {mode === "docs" ? <DocsMenuButton /> : <HomeMenuButton links={links} />}
        </div>
      </header>
      <SearchPill />
    </>
  );
}
