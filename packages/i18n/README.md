# @zedtech/zedkit-i18n

Typed message catalogs and a React provider factory shared with
`@zedtech/zedkit-ui`. Original work by the same author.

## Install

```sh
pnpm add @zedtech/zedkit-i18n
```

## Use

```ts
import { formatMessage } from "@zedtech/zedkit-i18n";
import { createMessagesContext } from "@zedtech/zedkit-i18n/react";

const catalog = { title: "Notes", pageOf: "Page {page} of {pageCount}" };
const { MessagesProvider, useMessages } = createMessagesContext(catalog);

formatMessage(catalog.pageOf, { page: 1, pageCount: 3 });
```

The UI kit wraps the same factory for `ZedkitUiProvider` / `useUiMessages`.
