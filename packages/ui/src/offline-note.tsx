"use client";

import { WifiOff } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./alert.js";
import { useUiMessages } from "./ui-provider.js";

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
export function OfflineNote({ title, children, className }: OfflineNoteProps) {
  const messages = useUiMessages();
  return (
    <Alert data-slot="offline-note" className={className}>
      <WifiOff aria-hidden />
      <AlertTitle>{title ?? messages.offlineTitle}</AlertTitle>
      <AlertDescription>{children ?? messages.offlineBody}</AlertDescription>
    </Alert>
  );
}
