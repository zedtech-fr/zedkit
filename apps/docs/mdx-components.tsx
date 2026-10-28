import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AgentName } from "@/components/agent-name";
import { DocsAreaLabel } from "@/components/docs-area-label";
import { DocsKitNameList } from "@/components/docs-kit-name-list";
import { MdxPre } from "@/components/mdx-pre";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    AgentName,
    DocsAreaLabel,
    DocsKitNameList,
    pre: MdxPre,
    ...components,
  };
}
