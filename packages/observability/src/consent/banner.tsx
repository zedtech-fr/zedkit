"use client";

// Original work by the same author.
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
} from "@zedtech/zedkit-ui";
import { useEffect, useState } from "react";
import { useConsentRecord, useConsentStoreInstance } from "./react.js";
import type { ConsentPreferences } from "./store.js";

export interface ConsentBannerProps {
  title: string;
  description: string;
  analyticsLabel: string;
  marketingLabel: string;
  acceptAllLabel: string;
  saveLabel: string;
}

export function ConsentBanner(props: ConsentBannerProps) {
  const store = useConsentStoreInstance();
  const record = useConsentRecord();
  const open = record === null;
  const [draft, setDraft] = useState<ConsentPreferences>({ analytics: false, marketing: false });

  useEffect(() => {
    if (record === null) {
      setDraft({ analytics: false, marketing: false });
    }
  }, [record]);

  const save = (preferences: ConsentPreferences) => store.write(preferences);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && store.read() === null) return;
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="consent-analytics">{props.analyticsLabel}</Label>
            <Switch
              id="consent-analytics"
              checked={draft.analytics}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, analytics: checked }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="consent-marketing">{props.marketingLabel}</Label>
            <Switch
              id="consent-marketing"
              checked={draft.marketing}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, marketing: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => save({ analytics: true, marketing: true })}>
            {props.acceptAllLabel}
          </Button>
          <Button type="button" onClick={() => save(draft)}>{props.saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
