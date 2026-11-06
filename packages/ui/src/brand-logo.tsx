import type { SVGProps } from "react";
import { cn } from "./utils.js";

export interface BrandLogoProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "title"> {
  /**
   * Accessible name of the brand, for example "Harbor Studio". Pass an empty string
   * when the brand name is already written next to the mark, so screen readers skip it.
   */
  title: string;
  /** The `viewBox` of your SVG, for example `"0 0 32 24"`. The aspect ratio follows from it. */
  viewBox: string;
}

/**
 * Your own brand mark as an inline SVG. Put your shapes (`<path>`, `<circle>`, ...) inside:
 * they paint with `currentColor`, so the mark follows the text colour. Light, dark and every
 * visual identity restyle it without a second asset. Size it with `className`
 * (for example `h-6 w-auto`); the mark keeps its aspect ratio.
 */
export function BrandLogo({ title, viewBox, className, children, ...props }: BrandLogoProps) {
  const decorative = title === "";
  return (
    <svg
      data-slot="brand-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      className={cn("h-6 w-auto shrink-0", className)}
      {...props}
    >
      {decorative ? null : <title>{title}</title>}
      {children}
    </svg>
  );
}
