import type * as React from "react";

import { Surface } from "./surface.js";
import { cn } from "./utils.js";

export type CardProps = React.ComponentProps<"div"> & {
  /**
   * Sizing recipe variant. With a `zk-query` slot ancestor (see
   * Container's `query` prop), padding, internal gap, radius and
   * title/body type step up in wide slots; without one, the base
   * (narrow) recipe applies. Omit for the default recipe.
   */
  size?: "sm" | "lg" | undefined;
};

function Card({ size, className, ...props }: CardProps) {
  return (
    <Surface
      data-slot="card"
      data-size={size}
      variant="solid"
      elevation={2}
      radius="xl"
      // The recipe owns radius: this utility wins the cn() merge over
      // Surface's rounded-xl and resolves the per-instance recipe var.
      className={cn("rounded-(--zk-card-radius)", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-title" className={cn("leading-none font-semibold tracking-tight", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("trim-pad-top", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center trim-pad-top", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
