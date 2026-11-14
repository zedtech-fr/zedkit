import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AgentName } from "@/features/docs/mdx/ui/agent-name";
import { DocsAreaLabel } from "@/features/docs/mdx/ui/docs-area-label";
import { DocsProseTable } from "@/features/docs/mdx/ui/docs-prose-table";
import { DocsKitNameList } from "@/features/docs/mdx/ui/docs-kit-name-list";
import { AiSetupPrompt } from "@/features/docs/mdx/ui/ai-setup-prompt";
import { SetupEntryPrompt } from "@/features/docs/mdx/ui/setup-entry-prompt";
import { AiSetupPageTitle } from "@/features/docs/mdx/ui/ai-setup-page-title";
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
