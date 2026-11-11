import { Badge, SidebarNavItem, StatusDot } from "@zedtech/zedkit-ui";
import { sidebarNavCopy } from "@/components/demos/i18n/sidebar-nav-copy";

/** The current run is marked active so it reads as the page you are on. */
export function SidebarNavActiveDemo() {
  return (
    <nav aria-label={sidebarNavCopy.navLabel}>
      <ul className="flex list-none flex-col gap-stack-tight">
        <li>
          <SidebarNavItem
            asChild
            active
            status={<StatusDot tone="success" />}
            meta={sidebarNavCopy.nightlyMeta}
            count={<Badge variant="meta">{sidebarNavCopy.nightlyCount}</Badge>}
          >
            <a href="#nightly">{sidebarNavCopy.nightly}</a>
          </SidebarNavItem>
        </li>
        <li>
          <SidebarNavItem asChild status={<StatusDot tone="idle" />} meta={sidebarNavCopy.stagingMeta}>
            <a href="#staging">{sidebarNavCopy.staging}</a>
          </SidebarNavItem>
        </li>
      </ul>
    </nav>
  );
}
