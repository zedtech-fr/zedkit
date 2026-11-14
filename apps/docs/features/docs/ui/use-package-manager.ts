import { createStoredChoice } from "@zedtech/zedkit-ui";
import { packageManagers, type PackageManager } from "@/lib/package-manager-commands";

/** The key fumadocs' `<Tabs groupId="package-manager" persist>` writes, so generated pages and these selects agree. */
const packageManager = createStoredChoice("package-manager", packageManagers);

export const isPackageManager: (value: string) => value is PackageManager = packageManager.isValue;

/** The visitor's package manager, shared by every command on the page and kept across pages. */
export const usePackageManager: () => readonly [PackageManager, (pm: PackageManager) => void] = packageManager.useChoice;
