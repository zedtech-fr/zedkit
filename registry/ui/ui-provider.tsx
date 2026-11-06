"use client";

import { createMessagesContext } from "@/components/ui/create-messages-context";
import type { ReactNode } from "react";

import { zedkitUiMessagesEn, type ZedkitUiMessages } from "@/components/ui/messages";

const { MessagesProvider, useMessages } = createMessagesContext<ZedkitUiMessages>(zedkitUiMessagesEn);

export function ZedkitUiProvider({
  messages,
  children,
}: {
  messages: ZedkitUiMessages;
  children: ReactNode;
}) {
  return <MessagesProvider messages={messages}>{children}</MessagesProvider>;
}

export function useUiMessages(): ZedkitUiMessages {
  return useMessages();
}
