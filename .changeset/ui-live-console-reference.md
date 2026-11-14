---
"@zedtech/zedkit-ui": minor
---

Bring the live agent console to the hosted reference: item header (kind, status, engine, name), decision flow line, boxed responsive stats, labelled transcript with an empty state, a live pulse on the run header, three-line sidebar rows (name, duration, model, tool count, status), and `subagent`/`gate` grouping. New `agentConsole` chrome keys (`mustChangeEmpty`, `transcript`, `noTranscriptTitle`, `noTranscriptDescription`, `tools`, `toolsOne`) — custom bundles must add them (see `Localize kit chrome in English or French`); `groupGate` is deprecated. `DetailPanel` grid stacks below `sm` (trio from `sm`, quint from `lg`); pass `grid-pair` at a call site that should pair at all widths. `useStickToBottom` takes `enabled` (a settled log starts at the top; selecting a settled item resets scroll).
