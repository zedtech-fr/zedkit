---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for. Without a Skill tool, open that skill's `SKILL.md` under `.agents/skills/` and follow its steps in this conversation (same for repo-added skills; explicit-only skills still need an explicit user call).

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Durable deliverables (persist by default)

Substantive audit, plan and from-audit work persists its
deliverables; chat is the summary, files are the record. An audit may leave
product code untouched while writing its report.

- **Home:** the configured tracker; else `.scratch/<slug>/` (`audit.md`,
  `spec.md`, `issues/`) — git-ignored, never `docs/`. Reuse the existing
  slug/folder when one exists; amend the artifact instead of forking a
  second one beside it.
- **Chat replies** summarize the outcome and link the saved files with exact
  paths, so a fresh session recovers scope and next actions from those
  files alone.
- **Opt-outs:** an explicit `chat-only` or `no-write` request stays in chat
  and writes nothing. Anything less explicit persists.
- **Continuity:** from-audit reads the saved audit first; implement
  reads the saved plan and keeps its checklist current.
- **Portability:** git-ignored storage does not travel across clones,
  worktrees or machines. A handoff names every required artifact and makes
  it available (attach, paste, or move to the tracker) instead of assuming
  the path resolves elsewhere.
