import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Themed toast viewport: render once near the app root, then call
 * sonner's `toast()` anywhere. Styling follows the theme tokens.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          toast: "bg-background text-foreground border-border",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
