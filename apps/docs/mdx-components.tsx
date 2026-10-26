import { cn, Stack } from "@zedtech/zedkit-ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

function PreWithScroll({ className, ...props }: ComponentProps<"pre">) {
  return (
    <Stack className="min-w-0 max-w-full overflow-x-auto">
      <pre className={cn(className)} {...props} />
    </Stack>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: PreWithScroll,
    ...components,
  };
}
