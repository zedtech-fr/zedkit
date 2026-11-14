---
"@zedtech/zedkit-ui": minor
---

Bring the live agent console to the hosted reference: item header (kind, status, engine, name), decision flow line, boxed responsive stats, labelled transcript with an empty state, run live pulse, three-line sidebar rows (name, duration, model, tool count, status), and `subagent`/`gate` grouping. New `agentConsole` chrome keys (`mustChangeEmpty`, `transcript`, `noTranscriptTitle`, `noTranscriptDescription`, `tools`) — custom bundles must add them (see `Localize kit chrome in English or French`); `groupGate` is deprecated. `DetailPanel` grid is responsive (pair, trio from `sm`, quint from `lg`). `useStickToBottom` takes `enabled` (a settled log starts at the top).
