"use client";

import { createContext, useContext, type ReactNode } from "react";

export type MessagesProviderProps<TMessages> = {
  messages: TMessages;
  children: ReactNode;
};

export function createMessagesContext<TMessages>(defaultMessages: TMessages) {
  const MessagesContext = createContext<TMessages>(defaultMessages);

  function MessagesProvider({ messages, children }: MessagesProviderProps<TMessages>) {
    return <MessagesContext.Provider value={messages}>{children}</MessagesContext.Provider>;
  }

  function useMessages(): TMessages {
    return useContext(MessagesContext);
  }

  return { MessagesProvider, useMessages, defaultMessages };
}
