# @zedtech/zedkit-observability

Logger and product-analytics **ports** with console, noop, and in-memory
adapters. React apps mount `ObservabilityProvider` and read
`useLogger` / `useTracker`. Optional subpaths wrap `pino` and a browser
analytics SDK (peer dependencies).

Original work by the same author.

```ts
import { createConsoleLogger, createNoopTracker } from "@zedtech/zedkit-observability";
import { ObservabilityProvider } from "@zedtech/zedkit-observability/react";
```

See [CATALOG.md](./CATALOG.md) for needs and examples.
