"use client";

import { createContext, useContext, type ReactNode } from "react";

import { zedkitUiMessagesEn, type ZedkitUiMessages } from "./messages.js";

const UiMessagesContext = createContext<ZedkitUiMessages>(zedkitUiMessagesEn);

export function ZedkitUiProvider({
  messages,
  children,
}: {
  messages: ZedkitUiMessages;
  children: ReactNode;
}) {
  return <UiMessagesContext.Provider value={messages}>{children}</UiMessagesContext.Provider>;
}

export function useUiMessages(): ZedkitUiMessages {
  return useContext(UiMessagesContext);
}
