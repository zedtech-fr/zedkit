# @zedtech/zedkit-storage

## 0.2.2

### Patch Changes

- 2fe5608: Point every package `homepage` at https://zedkit.app so npm package pages link the docs site.
- 003d355: Rebuild with TypeScript 6.0 (explicit ambient node types in tsconfig; no public API change).

## 0.2.1

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.2.0

### Minor Changes

- 75b133d: Initial `@zedtech/zedkit-storage`: env config, key sanitising, S3 client factory (`requestChecksumCalculation: WHEN_REQUIRED`), presigned PUT/GET, head, public URL helper, and cache/CSP header helpers.
