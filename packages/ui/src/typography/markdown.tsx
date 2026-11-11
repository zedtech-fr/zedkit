import type { ComponentProps } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

import { cn } from "../utils.js";

/**
 * Closed on purpose: `children` is Markdown source, not a React node, and
 * callers cannot pass rehype plugins or skip sanitize.
 */
export type MarkdownProps = {
  /** CommonMark source string. */
  children: string;
  className?: string;
};

const rehypePlugins = [rehypeSanitize];

function omitNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

function MarkdownAnchor(props: ComponentProps<"a"> & ExtraProps) {
  const { className, children, ...rest } = omitNode(props);
  // Same tab (`rel` is defense-in-depth). Info, not primary: references, not CTAs.
  return (
    <a className={cn("text-info underline link-offset", className)} {...rest} rel="noopener noreferrer">
      {children}
    </a>
  );
}

function MarkdownPre(props: ComponentProps<"pre"> & ExtraProps) {
  const { className, children, ...rest } = omitNode(props);
  return (
    <pre
      className={cn(
        "content-shrink rounded-md bg-muted px-control-inline py-control-block font-mono text-dense whitespace-pre-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </pre>
  );
}

function MarkdownCode(props: ComponentProps<"code"> & ExtraProps) {
  const { className, ...rest } = omitNode(props);
  return <code className={cn("rounded-md bg-muted px-badge-inline font-mono text-dense", className)} {...rest} />;
}

const markdownComponents = {
  a: MarkdownAnchor,
  pre: MarkdownPre,
  code: MarkdownCode,
};

/**
 * CommonMark to React. Raw HTML stays text; plugins and URL policy stay inside.
 */
function Markdown({ children, className }: MarkdownProps) {
  return (
    <div data-slot="markdown" className={cn(className)}>
      <ReactMarkdown rehypePlugins={rehypePlugins} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown };
