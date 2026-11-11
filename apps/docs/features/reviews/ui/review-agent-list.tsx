import type { ReactNode } from "react";
import {
  DetailPanel,
  EmptyState,
  Heading,
  Stack,
  StatusLabel,
  Text,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import type { ReviewAgentSummary, ReviewRunStatus } from "../ports/review-port";
import { STATUS_TONE } from "./review-badges";

export type ReviewAgentsReveal = "disclosure" | "section";

const DISCLOSURE_SUMMARY =
  "flex min-h-target cursor-pointer list-none items-center gap-stack-sm focus-ring-control [&::-webkit-details-marker]:hidden";

function isReviewRunStatus(status: string): status is ReviewRunStatus {
  return Object.hasOwn(STATUS_TONE, status);
}

function agentStatusValue(status: string, copy: ReviewsCopy): ReactNode {
  if (isReviewRunStatus(status)) {
    return <StatusLabel tone={STATUS_TONE[status]}>{copy.status[status]}</StatusLabel>;
  }
  return <Text typeRole="body">{status}</Text>;
}

function agentDetailItems(agent: ReviewAgentSummary, copy: ReviewsCopy) {
  const items: { label: string; value: ReactNode }[] = [
    { label: copy.agent.id, value: agent.id },
    { label: copy.agent.name, value: agent.name },
    { label: copy.agent.kind, value: agent.kind },
    { label: copy.console.status, value: agentStatusValue(agent.status, copy) },
  ];
  if (agent.model.trim().length > 0) {
    items.push({ label: copy.agent.model, value: agent.model });
  }
  return items;
}

function AgentList({ agents, copy }: { agents: readonly ReviewAgentSummary[]; copy: ReviewsCopy }) {
  return (
    <Stack gap="sm">
      {agents.map((agent, index) => (
        <DetailPanel key={`${agent.id}:${index}`} items={agentDetailItems(agent, copy)} />
      ))}
    </Stack>
  );
}

export function AgentDetail({
  agents,
  copy,
  reveal,
}: {
  agents: readonly ReviewAgentSummary[];
  copy: ReviewsCopy;
  reveal: ReviewAgentsReveal;
}) {
  if (reveal === "section") {
    return (
      <Stack gap="sm">
        <Heading level={2} typeRole="section">
          {copy.run.agents}
        </Heading>
        {agents.length > 0 ? (
          <AgentList agents={agents} copy={copy} />
        ) : (
          <EmptyState description={copy.pr.agentDetailEmpty} />
        )}
      </Stack>
    );
  }
  return (
    <details>
      <summary className={DISCLOSURE_SUMMARY}>{copy.pr.agentDetail}</summary>
      {agents.length > 0 ? (
        <AgentList agents={agents} copy={copy} />
      ) : (
        <EmptyState description={copy.pr.agentDetailEmpty} />
      )}
    </details>
  );
}
