import { Badge, SidebarNavItem, StatusDot } from "@zedtech/zedkit-ui";
import { sidebarNavCopy } from "@/components/demos/i18n/sidebar-nav-copy";

/** A run list: status on the left, title, then quiet meta and a count. */
export function SidebarNavItemDemo() {
  return (
    <nav aria-label={sidebarNavCopy.navLabel}>
      <ul className="flex list-none flex-col gap-stack-tight">
        <li>
          <SidebarNavItem
            status={<StatusDot tone="success" />}
            meta={sidebarNavCopy.nightlyMeta}
            count={<Badge variant="meta">{sidebarNavCopy.nightlyCount}</Badge>}
          >
            {sidebarNavCopy.nightly}
          </SidebarNavItem>
        </li>
        <li>
          <SidebarNavItem status={<StatusDot tone="idle" />} meta={sidebarNavCopy.stagingMeta}>
            {sidebarNavCopy.staging}
          </SidebarNavItem>
        </li>
      </ul>
    </nav>
  );
}
