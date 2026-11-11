import { Badge, SidebarNavGroup, SidebarNavItem, Stack, StatusDot } from "@zedtech/zedkit-ui";
import { sidebarNavCopy } from "@/components/demos/i18n/sidebar-nav-copy";

/** A labelled group of runs that opens with native disclosure. */
export function SidebarNavGroupDemo() {
  return (
    <nav aria-label={sidebarNavCopy.navLabel}>
      <SidebarNavGroup label={sidebarNavCopy.groupLabel} open>
        <Stack gap="tight">
          <SidebarNavItem
            status={<StatusDot tone="success" />}
            meta={sidebarNavCopy.nightlyMeta}
            count={<Badge variant="meta">{sidebarNavCopy.nightlyCount}</Badge>}
          >
            {sidebarNavCopy.nightly}
          </SidebarNavItem>
          <SidebarNavItem status={<StatusDot tone="warning" />} meta={sidebarNavCopy.stagingMeta}>
            {sidebarNavCopy.staging}
          </SidebarNavItem>
          <SidebarNavItem status={<StatusDot tone="idle" />}>{sidebarNavCopy.preview}</SidebarNavItem>
        </Stack>
      </SidebarNavGroup>
    </nav>
  );
}
