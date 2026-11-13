/**
 * Which Fumadocs page tree the docs sidebar should show.
 * UI component routes get the UI folder (job groups), not the root
 * package folders.
 *
 * @param {{ children?: Array<{ type?: string, $id?: string, name?: unknown, url?: string, children?: unknown[] }> }} root
 * @param {string[] | undefined} slug
 */
export function docsLayoutTree(root, slug = []) {
  if (slug[0] !== "ui") return root;
  const ui = (root.children ?? []).find((node) => isUiDocsFolder(node));
  if (!ui) return root;
  return { ...root, name: ui.name, children: ui.children ?? [] };
}

function isUiDocsFolder(node) {
  if (node.type !== "folder") return false;
  if (node.$id === "ui") return true;
  return (node.children ?? []).some(
    (child) => child.type === "page" && typeof child.url === "string" && child.url.startsWith("/docs/ui/"),
  );
}
