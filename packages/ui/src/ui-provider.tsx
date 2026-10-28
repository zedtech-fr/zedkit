"use client";

import { createMessagesContext } from "@zedtech/zedkit-i18n/react";

import { zedkitUiMessagesEn, type ZedkitUiMessages } from "./messages.js";

const { MessagesProvider: ZedkitUiProvider, useMessages: useUiMessages } =
  createMessagesContext<ZedkitUiMessages>(zedkitUiMessagesEn);

export { ZedkitUiProvider, useUiMessages };
