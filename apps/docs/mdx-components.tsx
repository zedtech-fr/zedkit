import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AgentName } from "@/components/agent-name";
import { DocsAreaLabel } from "@/components/docs-area-label";
import { DocsProseTable } from "@/components/docs-prose-table";
import { DocsKitNameList } from "@/components/docs-kit-name-list";
import { AiSetupPrompt } from "@/components/ai-setup-prompt";
import { SetupEntryPrompt } from "@/components/setup-entry-prompt";
import { AiSetupPageTitle } from "@/components/ai-setup-page-title";
import { MdxPre } from "@/components/mdx-pre";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    AgentName,
    DocsAreaLabel,
    DocsKitNameList,
    DocsProseTable,
    AiSetupPrompt,
    SetupEntryPrompt,
    AiSetupPageTitle,
    pre: MdxPre,
    table: DocsProseTable,
    ...components,
  };
}
