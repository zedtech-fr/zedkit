import type * as React from "react";
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
  /** Extra classes on the host wrapper. */
  className?: string;
};

const rehypePlugins = [rehypeSanitize];

function omitNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

function isFencedCode(children: React.ReactNode, className?: string): boolean {
  const text = Array.isArray(children) ? children.map(String).join("") : String(children);
  return text.includes("\n") || /\blanguage-/.test(className ?? "");
}

function MarkdownAnchor(props: React.ComponentProps<"a"> & ExtraProps) {
  const { className, children, ...rest } = omitNode(props);
  // Same tab (`rel` is defense-in-depth). Info, not primary: references, not CTAs.
  return (
    <a className={cn("text-info underline link-offset focus-ring", className)} {...rest} rel="noopener noreferrer">
      {children}
    </a>
  );
}

function MarkdownPre(props: React.ComponentProps<"pre"> & ExtraProps) {
  const { className, children, ...rest } = omitNode(props);
  return (
    <pre
      className={cn(
        "content-shrink rounded-md bg-muted px-control-inline py-control-block font-mono text-dense wrap-anywhere whitespace-pre-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </pre>
  );
}

function MarkdownCode(props: React.ComponentProps<"code"> & ExtraProps) {
  const { className, children, ...rest } = omitNode(props);
  return (
    <code
      className={cn(
        "font-mono text-dense",
        !isFencedCode(children, className) && "rounded-md bg-muted px-code-inline",
        className,
      )}
      {...rest}
    >
      {children}
    </code>
  );
}

function MarkdownImage(props: React.ComponentProps<"img"> & ExtraProps) {
  const { className, ...rest } = omitNode(props);
  return <img className={cn("max-w-full h-auto", className)} {...rest} />;
}

const markdownComponents = {
  a: MarkdownAnchor,
  pre: MarkdownPre,
  code: MarkdownCode,
  img: MarkdownImage,
};

/**
 * CommonMark to React. Raw HTML is not rendered; plugins and URL policy
 * (rehype-sanitize default schema) stay inside.
 */
function Markdown({ children, className }: MarkdownProps) {
  return (
    <div data-slot="markdown" className={cn("content-shrink", className)}>
      <ReactMarkdown rehypePlugins={rehypePlugins} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown };
