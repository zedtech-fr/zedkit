"use client";

import { createMessagesContext } from "@zedtech/zedkit-i18n/react";
import type { ReactNode } from "react";

import { zedkitUiMessagesEn, type ZedkitUiMessages } from "./messages.js";

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
