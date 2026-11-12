import Link from "next/link";
import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { registryBrickNames } from "../content/registry-site";
import { componentPageHeaderMeta, componentPageSections } from "../lib/component-page-sections.mjs";
import { DEFAULT_PROPS_PRIORITY } from "../lib/props-priority.mjs";
import { ComponentPreview } from "./component-preview";
import { ComponentWrapsLine } from "./component-wraps-line";
import { MaturityBadge } from "./maturity-badge";
import { PropsTable } from "./props-table";
import { AdoptionPanelView, adoptionPlanFor } from "./adoption-panel-view";
import { highlightedTs } from "./highlighted-code";
import { componentPageCopy } from "@/components/i18n/component-page-copy";
import type { AdoptionPlan } from "@/lib/adoption-types";
import { kitUiSourceUrl } from "@/lib/site-links.mjs";
import { OffPathLink } from "@/ui/off-path-link";

export interface CatalogExample {
  title: string;
  code: string;
}

export interface RelatedLink {
  title: string;
  href: string;
}

/** The typed adoption contract the catalog declares for the need (JavaScript, stylesheet or config). */
type CatalogAdoption = Parameters<typeof adoptionPlanFor>[0]["need"]["adoption"];

export interface ComponentPageProps {
  /** Catalog heading of the need. */
  needName: string;
  shortName: string;
  adoption: CatalogAdoption;
  /** When the first example is a whole file, where it goes (for instance `src/app/layout.tsx`). */
  exampleFile?: string;
  packageName: string;
  version: string;
  status: string;
  purpose: string;
  audience: string;
  whenToUse: string;
  whenNotToUse: string;
  wraps: string;
  /** Manifest source path under packages/ui/src, for the first-screen Source link. */
  sourceFile?: string | null;
  /** Sidebar job group (Actions / Forms / …) for the breadcrumb. */
  navGroup?: string;
  registry: string;
  demo: string;
  propsFile: string | null;
  propsName: string | null;
  propsPriority?: string[];
  /** Folds every prop outside `propsPriority`; names and links the folded group. */
  propsRest?: { summary: string; href: string };
  examples: CatalogExample[];
  /** Example title → demo registry key: a live preview rendered above that code block. */
  examplePreviews?: Record<string, string>;
  a11y: string;
  troubleshooting: string;
  related: RelatedLink[];
}

/** Catalog prose marks code with backticks; render them as `<code>`, not literal ticks. */
function inlineCode(text: string) {
  return text.split(/`([^`]+)`/).map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

/**
 * Métier: public TypeScript kit documentation.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers.
 * Customer personas: hurried, on a component page to see a live control and copy it.
 * UI decisions: breadcrumb + 40/500 title + lead + Stable/package/Source, because customer = pick a component not a package.
 */
export async function ComponentPage({
  needName,
  shortName,
  adoption,
  exampleFile,
  packageName,
  version,
  status,
  purpose,
  audience,
  whenToUse,
  whenNotToUse,
  wraps,
  sourceFile,
  navGroup,
  registry,
  demo,
  propsFile,
  propsName,
  propsPriority = DEFAULT_PROPS_PRIORITY,
  propsRest,
  examples,
  examplePreviews = {},
  a11y,
  troubleshooting,
  related,
}: ComponentPageProps) {
  const hasProps = Boolean(propsFile && propsName);
  const sections = componentPageSections({ hasProps, a11y, related, troubleshooting });
  const header = componentPageHeaderMeta({ status, purpose, packageName, wraps });
  const sourceHref = kitUiSourceUrl(sourceFile ?? "");
  const copyable = registry.length > 0 && registryBrickNames.includes(registry);
  const plan: AdoptionPlan = adoptionPlanFor({
    need: { need: needName, shortName, adoption, examples, registry: copyable ? registry : "", ...(exampleFile ? { exampleFile } : {}) },
    packageName,
  });

  return (
    <Stack gap="blocks" data-component-page="">
      <Stack gap="sm" data-component-page-header="">
        {navGroup ? (
          <Text
            as="p"
            data-component-page-breadcrumb=""
            className="font-mono text-dense text-muted-foreground"
          >
            {componentPageCopy.header.breadcrumb(navGroup)}
          </Text>
        ) : null}
        <Heading level={1}>{shortName}</Heading>
        <Text typeRole="lead" className="text-muted-foreground">
          {header.purpose}
        </Text>
        <Stack direction="horizontal" gap="md" className="flex-wrap text-dense text-muted-foreground">
          <Text as="span" data-component-maturity={header.maturity}>
            {header.maturity.toLowerCase() === "stable" ? (
              componentPageCopy.header.stable
            ) : (
              <MaturityBadge status={header.maturity} />
            )}
          </Text>
          <Text as="span" data-component-package="" className="font-mono text-foreground">
            {header.packageName}
          </Text>
          {sourceHref ? (
            <OffPathLink href={sourceHref} aria-label={componentPageCopy.header.source} className="font-medium">
              {componentPageCopy.header.source}
            </OffPathLink>
          ) : null}
        </Stack>
      </Stack>

      <Stack id="example">
        <ComponentPreview demo={demo} hasProps={hasProps} a11yRoot />
      </Stack>

      <Section title={componentPageCopy.sections.usageAndStates} id="usage-and-states" className="space-y-stack-md">
        <Stack gap="lg">
          {copyable ? (
            <Text variant="muted" data-usage-import-note="">
              {componentPageCopy.usageImportNote(registry)}
            </Text>
          ) : null}
          {await Promise.all(
            examples.map(async (ex) => {
              const previewDemo = examplePreviews[ex.title];
              return (
                <Stack key={ex.title} gap="sm">
                  {previewDemo ? (
                    <>
                      <Heading level={3}>{ex.title}</Heading>
                      <ComponentPreview demo={previewDemo} hasProps={false} />
                      {await highlightedTs(ex.code)}
                    </>
                  ) : (
                    await highlightedTs(ex.code, ex.title)
                  )}
                </Stack>
              );
            }),
          )}
        </Stack>
      </Section>

      <Section title={componentPageCopy.sections.installOrCopy} id="install-or-copy" className="space-y-stack-md">
        <Stack gap="md">
          <AdoptionPanelView plan={plan} />
          <Text variant="muted" className="text-caption">
            {componentPageCopy.packageVersionLine(version)}
          </Text>
        </Stack>
      </Section>

      <dl id="guidance" data-term-row="" className="trim-margin grid gap-x-meta gap-y-stack-sm text-dense text-muted-foreground sm:items-baseline">
        <dt className="trim-margin font-normal text-foreground">{componentPageCopy.guidance.who}</dt>
        <dd className="trim-margin content-shrink">{audience}</dd>
        <dt className="trim-margin font-normal text-foreground">{componentPageCopy.guidance.useWhen}</dt>
        <dd className="trim-margin content-shrink">{whenToUse}</dd>
        <dt className="trim-margin font-normal text-foreground">{componentPageCopy.guidance.avoidWhen}</dt>
        <dd className="trim-margin content-shrink">{whenNotToUse}</dd>
      </dl>
      <ComponentWrapsLine wraps={header.wraps} />

      {sections.includes("props") ? (
        <Section title={componentPageCopy.sections.props} id="props">
          <PropsTable file={propsFile!} name={propsName!} priority={propsPriority} {...(propsRest ? { rest: propsRest } : {})} />
        </Section>
      ) : null}

      {sections.includes("accessibility") ? (
        <Section title={componentPageCopy.sections.accessibility} id="accessibility">
          <Text>{inlineCode(a11y)}</Text>
        </Section>
      ) : null}

      {sections.includes("related") ? (
        <Section title={componentPageCopy.sections.related} id="related">
          <Stack gap="sm">
            {related.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary underline link-offset hover:no-underline">
                {link.title}
              </Link>
            ))}
          </Stack>
        </Section>
      ) : null}

      {sections.includes("troubleshooting") ? (
        <Section title={componentPageCopy.sections.troubleshooting} id="troubleshooting">
          <Text>{troubleshooting}</Text>
        </Section>
      ) : null}
    </Stack>
  );
}
