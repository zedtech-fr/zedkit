# Route modals (Next.js parallel + intercepting routes)

Verified against `@zedtech/zedkit-ui` 0.4.0 and Next from the docs
workspace catalog at writing time. The same recipe is merged into the
RouteModal catalog page on the docs site (`apps/docs/prose/ui/render-a-route-as-a-modal-over-the-list.mdx`).

Open a list detail in an overlay without leaving the list: the URL
stays shareable (direct access renders the full page), closing
returns to the list with its query state intact. The kit owns the
overlay shell (`RouteModal`, `closeRoute`); the app owns the route
files and the shared detail view.

## Drawer vs dialog vs page

| Content | Render as | Why |
|---|---|---|
| Record detail from a list | `RouteModal` drawer (default) | Keeps list context; roomy; fullscreen on mobile |
| Destructive confirmation on a route | `RouteModal` `variant="dialog"` | Small, focused; Esc and backdrop dismiss |
| Destructive confirmation on local state | `ConfirmDialog` | No route — trigger plus callback |
| Multi-step flow, SEO, deep links | Full page | Overlays are for quick tasks, not journeys |

## Recipe

File tree for an `items` list with a detail overlay:

```text
app/items/
├── layout.tsx              # renders {children} + {modal}
├── page.tsx                # the list (links to /items/[id])
├── [id]/
│   └── page.tsx            # full detail page (direct access, refresh)
├── @modal/
│   ├── default.tsx         # null when no intercept is active
│   └── (.)[id]/
│       └── page.tsx        # intercept: same detail view in RouteModal
└── _detail-view.tsx        # shared view (both pages import this)
```

Layout with the modal slot:

```tsx
// app/items/layout.tsx
export default function ItemsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

Intercept page (reuses the shared view so drawer and full page never drift):

```tsx
// app/items/@modal/(.)[id]/page.tsx
"use client";

import { RouteModal, closeRoute } from "@zedtech/zedkit-ui";
import { useRouter } from "next/navigation";
import { DetailView } from "../../_detail-view";

export default function ItemModal({ params }: { params: { id: string } }) {
  const router = useRouter();
  return (
    <RouteModal
      title="Item"
      onClose={() => closeRoute({ ...router, fallback: "/items" })}
    >
      <DetailView id={params.id} />
    </RouteModal>
  );
}
```

Default slot (no modal on direct load of the list or full page):

```tsx
// app/items/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

Full-page detail (same `DetailView`):

```tsx
// app/items/[id]/page.tsx
import { DetailView } from "../_detail-view";

export default function ItemPage({ params }: { params: { id: string } }) {
  return <DetailView id={params.id} />;
}
```

## closeRoute

`closeRoute` prefers `router.back()` when the previous history entry is
same-document; otherwise it `replace`s the `fallback` path (bookmark,
external referrer, or single history entry). Pass the Next.js router
methods explicitly:

```tsx
closeRoute({ back: router.back, replace: router.replace, fallback: "/items" });
```

`RouteModal` calls `onClose` only after the exit animation (or
immediately when `prefers-reduced-motion` is set). Wire `onClose` to
`closeRoute`, not raw `router.back`, so the panel finishes closing
before navigation.

## Checklist

- List links use real paths (`/items/[id]`), not hash or query-only IDs.
- One shared detail component for intercept and full page.
- Loading and error UI live inside that shared view.
- Fallback path matches the list route (including base path if hosted under a prefix).
- Keyboard: Esc and focus trap come from the underlying Drawer/Dialog primitives.
