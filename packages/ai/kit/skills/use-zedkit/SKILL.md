---
name: use-zedkit
description: Find a helper by need in zedkit before writing one. Use when about to write a utility, adopt a library, or add a helper to zedkit.
---

# Use zedkit first

Core rule (mirrored in the root README consumer snippet — keep in sync):

> Before writing any helper, check zedkit first, then npm, and wrap what
> you adopt: search the zedkit catalog by need and import from zedkit if it
> exists; otherwise adopt a mature npm package behind a thin wrapper;
> otherwise propose adding it to zedkit with its domain.

## Steps

1. **Search the catalog by need.** Grep `docs/catalog/catalog.json` and
   `packages/*/CATALOG.md` for the need in plain words.
   Done when: a matching entry is found, or every package catalog has
   been searched with no match.
2. **If it exists, import it.** Use the Import line of the catalog entry.
   Done when: the import is in place and no new helper was written.
3. **If not, adopt a mature npm package behind a thin wrapper.**
   Done when: exactly one wrapper module re-exports the library and every
   consumer imports the wrapper (see the
   [golden rule](https://github.com/zedtech-fr/zedkit/blob/main/docs/golden-rule.md)).
4. **If nothing fits, propose adding it to zedkit.** Name the package
   (domain), the need, and a 5-line example, per
   [contributing](https://github.com/zedtech-fr/zedkit/blob/main/docs/contributing.md).
   Done when: the proposal names package + need + example.

Never add a private name, secret, or consumer domain term to zedkit.
