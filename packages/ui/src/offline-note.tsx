import { WifiOff } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./alert.js";

export interface OfflineNoteProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Offline flag: alert-style note with overridable wording. Pair with
 * `useOnlineStatus` (`{online ? null : <OfflineNote />}`); announced
 * assertively via the alert role.
 */
export function OfflineNote({
  title = "You're offline.",
  children = "Changes will sync when you reconnect.",
  className,
}: OfflineNoteProps) {
  return (
    <Alert className={className}>
      <WifiOff aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
