import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AgentName } from "@/components/agent-name";
import { MdxPre } from "@/components/mdx-pre";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    AgentName,
    pre: MdxPre,
    ...components,
  };
}
