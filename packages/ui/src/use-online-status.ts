"use client";

import * as React from "react";

/**
 * Browser online state. Starts `true` everywhere (no browser access
 * during render, so server output matches) and syncs + subscribes in
 * an effect: `online`/`offline` window events flip the value.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}
