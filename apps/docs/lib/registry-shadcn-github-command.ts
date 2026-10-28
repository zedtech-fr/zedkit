/** shadcn GitHub registry shorthand (same bricks as `/r/<brick>.json` on the docs site). */
export function registryShadcnGithubCommand(brick: string): string {
  return `npx shadcn@latest add zedtech-fr/zedkit/${brick}`;
}
