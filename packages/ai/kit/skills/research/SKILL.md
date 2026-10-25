---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up the **`researcher`** background agent to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Report the findings as a single Markdown text, citing each claim's source.
3. The caller writes it to a file: where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where. The agent is read-only and never writes.
