"use client";

import { useState } from "react";
import { Button, Field, FieldLabel, Input, Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import {
  requestIdentitySuggest,
  tokenDiff,
  type SuggestProposal,
} from "@/lib/identity-editor-suggest";

function DiffRows({ current, next }: { current: IdentityTokens; next: IdentityTokens }) {
  const rows = tokenDiff(current, next);
  if (rows.length === 0) return <Text>No token changes.</Text>;
  return (
    <Stack gap={1} data-slot="identity-editor-suggest-diff">
      {rows.map((row) => (
        <Text key={row.path}>
          {row.path}: {row.from} → {row.to}
        </Text>
      ))}
    </Stack>
  );
}

function ProposalCard({
  current,
  proposal,
  onApply,
  onDiscard,
}: {
  current: IdentityTokens;
  proposal: SuggestProposal;
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <Stack gap={2} role="status">
      <Text>{proposal.notice}</Text>
      <DiffRows current={current} next={proposal.tokens} />
      <Stack direction="horizontal" gap={2}>
        <Button type="button" onClick={onApply}>
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      </Stack>
    </Stack>
  );
}

function IdentityEditorSuggest({
  tokens,
  onApply,
}: {
  tokens: IdentityTokens;
  onApply: (tokens: IdentityTokens) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<SuggestProposal | null>(null);

  function runSuggest() {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    void requestIdentitySuggest(trimmed, tokens).then((result) => {
      setProposal(result);
      setBusy(false);
    });
  }

  return (
    <Stack gap={3} data-slot="identity-editor-suggest">
      <Text>Describe a look, then Suggest. Review the list before Apply.</Text>
      <Field>
        <FieldLabel htmlFor="identity-editor-suggest">Request</FieldLabel>
        <Input
          id="identity-editor-suggest"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") runSuggest();
          }}
        />
      </Field>
      <Button type="button" onClick={runSuggest} disabled={busy || prompt.trim() === ""}>
        Suggest
      </Button>
      {proposal ? (
        <ProposalCard
          current={tokens}
          proposal={proposal}
          onApply={() => {
            onApply(proposal.tokens);
            setProposal(null);
          }}
          onDiscard={() => setProposal(null)}
        />
      ) : null}
    </Stack>
  );
}

export { IdentityEditorSuggest };
