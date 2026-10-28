# Third-party notices — @zedtech/zedkit-ui

## shadcn/ui

- What: component code copied in and adapted (starting with the
  `cn()` classnames util; components follow per slice), plus the
  CSS-variable theme structure.
- Upstream: https://github.com/shadcn-ui/ui
- Author: shadcn
- License: MIT (full text below, as the license requires).
- Modifications: import paths adapted to this package (`./utils.js`,
  workspace catalog versions); theme values kept neutral; no
  behavioral changes except where a component README notes them.

```
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Runtime dependencies (used, not copied)

MIT-licensed packages consumed as dependencies — see their own
packages for license texts: Radix UI primitives (`@radix-ui/*`),
`class-variance-authority`, `clsx`, `tailwind-merge`,
`lucide-react`, `sonner`, `@tanstack/react-table`, `react-day-picker`, `downshift`.
