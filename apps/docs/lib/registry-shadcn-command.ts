/** shadcn CLI add URL for a published registry brick (same formula as component pages). */
export function registryShadcnAddCommand(siteUrl: string, brick: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `npx shadcn@latest add ${base}/r/${brick}.json`;
}
