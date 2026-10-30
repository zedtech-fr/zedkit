---
"@zedtech/zedkit-ui": minor
---

Additive type exports `DialogProps` and `FormFieldProps`, naming the props
`Dialog` and `FormField` already accepted (same pattern as `TabsProps`).
They let the docs generator render Props tables for the modal-dialogs and
validated-forms pages, which shipped without one.
