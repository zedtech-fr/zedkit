import { Badge, SidebarNavGroup, SidebarNavItem, StatusDot } from "@zedtech/zedkit-ui";
import { sidebarNavCopy } from "@/components/demos/i18n/sidebar-nav-copy";

/** A labelled group of runs that opens with native disclosure. */
export function SidebarNavGroupDemo() {
  return (
    <nav aria-label={sidebarNavCopy.navLabel}>
      <ul className="flex list-none flex-col gap-stack-tight">
        <li>
          <SidebarNavGroup label={sidebarNavCopy.groupLabel} open>
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
                <SidebarNavItem status={<StatusDot tone="warning" />} meta={sidebarNavCopy.stagingMeta}>
                  {sidebarNavCopy.staging}
                </SidebarNavItem>
              </li>
              <li>
                <SidebarNavItem status={<StatusDot tone="idle" />}>{sidebarNavCopy.preview}</SidebarNavItem>
              </li>
            </ul>
          </SidebarNavGroup>
        </li>
      </ul>
    </nav>
  );
}
