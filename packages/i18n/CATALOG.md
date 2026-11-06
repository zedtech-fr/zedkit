# Catalog — @zedtech/zedkit-i18n

- Keywords: i18n, localization, messages, react, typescript
- Audience: App authors who pass typed copy objects instead of scattering literals.
- Purpose: Format `{name}` templates and build a typed React messages context.
- Attribution: Original work by the same author.

## Format message templates

- Import: `@zedtech/zedkit-i18n` — `formatMessage`
- Wraps: `(none)`
- Status: alpha
- Short name: formatMessage
- Audience: Any TypeScript code with simple `{placeholder}` strings.
- Purpose: Replace `{key}` segments without adopting a full i18n stack.
- When to use: Pagination labels, short templates in typed catalogs.
- When not to use: ICU plurals or locale-aware dates — use `Intl` or a dedicated i18n library at the app root.

```ts
import { formatMessage } from "@zedtech/zedkit-i18n";
formatMessage("Page {page} of {pageCount}", { page: 2, pageCount: 5 });
```

## Create a typed messages context

- Import: `@zedtech/zedkit-i18n/react` — `createMessagesContext`, `MessagesProviderProps`
- Wraps: `react`
- Status: alpha
- Short name: createMessagesContext
- Audience: React apps that inject a copy object once at the root.
- Purpose: Returns `MessagesProvider`, `useMessages`, and `defaultMessages` for a catalog type.
- When to use: Feature folders with a `copy` object, or wrapping kit chrome like the UI provider.
- When not to use: When you already use a framework i18n layer — keep catalogs there and pass derived strings as props.

```ts
import { createMessagesContext } from "@zedtech/zedkit-i18n/react";

const catalog = { save: "Save" };
const { MessagesProvider, useMessages } = createMessagesContext(catalog);
```
