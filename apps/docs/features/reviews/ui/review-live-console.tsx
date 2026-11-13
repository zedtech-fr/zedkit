"use client";

/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor watching a public run; maintainer opening a share link.
 * UI decisions:
 * - Client console on a static HTML shell — because: static export cannot pre-bake a run created after deploy.
 * - Kit AgentConsole plus ErrorState / Skeleton / LivePulse / UpdatedAgo — because: the visitor stays on zedkit, not an off-site live UI.
 * - Poll while starting/running, slower when the tab is hidden — because: the live API answers 204 when unchanged.
 */

import { useEffect, useState } from "react";
import { LivePulse, Stack, UpdatedAgo } from "@zedtech/zedkit-ui";

import { liveConsoleCopy } from "../i18n/review-live-console-copy";
import { reviewsCopy } from "../i18n/reviews-copy";
import { LIVE_CONSOLE_PATH, parseLiveConsoleLocation, writeLiveConsoleSearch } from "../model/live-console-href";
import {
  applyLiveRunResult,
  isLiveRunActive,
  liveRunPollIntervalMs,
  readyFromLive,
  type LiveConsoleStatus,
} from "../model/live-run-poll";
import { mergeReviewShareUrl } from "../model/selection";
import type { LiveRunSubscribe } from "../ports/live-run-port";
import type { PublicLiveRun } from "../ports/review-port";
import { ConsoleLoading, ConsoleNotice } from "./review-live-console-states";
import { ReviewConsoleView } from "./review-console-view";

function writeItemLocation(runId: string, itemId: string) {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  window.history.replaceState(
    null,
    "",
    mergeReviewShareUrl({
      pathname: window.location.pathname,
      search: writeLiveConsoleSearch({
        search: window.location.search,
        runId,
        itemId,
        includeId: pathname === LIVE_CONSOLE_PATH,
      }),
      hash: "",
    }),
  );
}

function useConsoleItemId(runId: string, itemIdProp?: string | null) {
  const [itemId, setItemId] = useState<string | null>(itemIdProp ?? null);
  const [locationReady, setLocationReady] = useState(itemIdProp !== undefined);
  useEffect(() => {
    if (itemIdProp !== undefined) {
      setItemId(itemIdProp);
      setLocationReady(true);
      return;
    }
    const location = parseLiveConsoleLocation(
      window.location.search,
      window.location.hash,
      runId,
    );
    setItemId(location.itemId);
    setLocationReady(true);
  }, [itemIdProp, runId]);
  return { itemId, setItemId, locationReady };
}

function useLiveConsole({
  runId,
  itemId: itemIdProp,
  initial,
  runsBase,
  subscribe,
}: {
  runId: string;
  itemId?: string | null;
  initial: PublicLiveRun | null;
  runsBase: string | undefined;
  subscribe: LiveRunSubscribe;
}) {
  const { itemId, setItemId, locationReady } = useConsoleItemId(runId, itemIdProp);
  const [status, setStatus] = useState<LiveConsoleStatus>(() =>
    initial === null ? { kind: "loading" } : readyFromLive(initial),
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!locationReady) return;
    const stop = subscribe({
      runId,
      itemId,
      intervalMs: liveRunPollIntervalMs(document.hidden),
      ...(runsBase === undefined ? {} : { base: runsBase }),
      onResult: (result) => {
        setStatus((previous) => applyLiveRunResult(result, previous));
      },
    });
    const onVisibility = () => {
      setRetryKey((value) => value + 1);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runId, itemId, retryKey, runsBase, subscribe, locationReady]);

  return {
    itemId,
    setItemId,
    locationReady,
    status,
    retry: () => {
      setStatus(initial === null ? { kind: "loading" } : readyFromLive(initial));
      setRetryKey((value) => value + 1);
    },
  };
}

function LiveConsoleReady({
  runId,
  itemId,
  issueNumber,
  unlinkedPr,
  status,
  onSelect,
}: {
  runId: string;
  itemId: string | null;
  issueNumber?: number | null | undefined;
  unlinkedPr?: number | null | undefined;
  status: Extract<LiveConsoleStatus, { kind: "ready" }>;
  onSelect: (id: string) => void;
}) {
  const liveIssue = status.live.run.issue ?? issueNumber ?? null;
  const livePr = liveIssue == null ? (status.live.run.pr ?? unlinkedPr ?? null) : null;
  return (
    <ReviewConsoleView
      issueNumber={liveIssue}
      unlinkedPr={livePr}
      runId={runId}
      run={status.mapped.run}
      items={status.mapped.items}
      decision={status.mapped.decision ?? null}
      {...(itemId === null ? {} : { selectedId: itemId })}
      onSelectedIdChange={onSelect}
      status={
        <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
          <LivePulse
            active={isLiveRunActive(status.live.run.status)}
            label={liveConsoleCopy.live}
            inactiveLabel={liveConsoleCopy.idle}
          />
          <UpdatedAgo date={status.fetchedAt} />
        </Stack>
      }
      copy={reviewsCopy}
    />
  );
}

type ReviewLiveConsoleProps = {
  runId: string;
  itemId?: string | null | undefined;
  issueNumber?: number | null | undefined;
  unlinkedPr?: number | null | undefined;
  initial?: PublicLiveRun | null | undefined;
  runsBase?: string | undefined;
  subscribe: LiveRunSubscribe;
};

export function ReviewLiveConsole({
  runId,
  itemId: itemIdProp,
  issueNumber,
  unlinkedPr,
  initial = null,
  runsBase,
  subscribe,
}: ReviewLiveConsoleProps) {
  const live = useLiveConsole({
    runId,
    initial: initial ?? null,
    runsBase,
    subscribe,
    ...(itemIdProp === undefined ? {} : { itemId: itemIdProp }),
  });
  if (!live.locationReady || live.status.kind === "loading") return <ConsoleLoading />;
  if (live.status.kind === "unauthorized") {
    return (
      <ConsoleNotice
        title={liveConsoleCopy.unauthorized.title}
        description={liveConsoleCopy.unauthorized.description}
      />
    );
  }
  if (live.status.kind === "not-found") {
    return (
      <ConsoleNotice title={liveConsoleCopy.notFound.title} description={liveConsoleCopy.notFound.description} />
    );
  }
  if (live.status.kind === "invalid" || live.status.kind === "error") {
    return (
      <ConsoleNotice
        title={liveConsoleCopy.error.title}
        description={liveConsoleCopy.error.description}
        retry={live.retry}
      />
    );
  }
  return (
    <LiveConsoleReady
      runId={runId}
      itemId={live.itemId}
      issueNumber={issueNumber}
      unlinkedPr={unlinkedPr}
      status={live.status}
      onSelect={(id) => {
        writeItemLocation(runId, id);
        live.setItemId(id);
      }}
    />
  );
}

export function ReviewLiveConsoleFromSearch({
  runsBase,
  subscribe,
}: {
  runsBase?: string | undefined;
  subscribe: LiveRunSubscribe;
}) {
  const [location, setLocation] = useState(() => parseLiveConsoleLocation("", ""));
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const read = () => {
      setLocation(parseLiveConsoleLocation(window.location.search, window.location.hash));
      setBooted(true);
    };
    read();
    window.addEventListener("popstate", read);
    window.addEventListener("hashchange", read);
    return () => {
      window.removeEventListener("popstate", read);
      window.removeEventListener("hashchange", read);
    };
  }, []);

  if (!booted) return <ConsoleLoading />;
  if (location.reason === "missing-id") {
    return (
      <ConsoleNotice title={liveConsoleCopy.missingId.title} description={liveConsoleCopy.missingId.description} />
    );
  }
  if (location.runId === null) {
    return (
      <ConsoleNotice title={liveConsoleCopy.invalidId.title} description={liveConsoleCopy.invalidId.description} />
    );
  }
  return (
    <ReviewLiveConsole
      runId={location.runId}
      itemId={location.itemId}
      {...(runsBase === undefined ? {} : { runsBase })}
      subscribe={subscribe}
    />
  );
}
