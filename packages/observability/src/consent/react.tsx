"use client";

// Original work by the same author.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { runConsentGatedLoader, type ConsentLoader } from "./gated-tracker.js";
import {
  type ConsentCategory,
  type ConsentRecord,
  type ConsentStore,
  isCategoryGranted,
} from "./store.js";

const ConsentContext = createContext<ConsentStore | null>(null);

export interface ConsentProviderProps {
  store: ConsentStore;
  children: ReactNode;
}

export function ConsentProvider(props: ConsentProviderProps) {
  return <ConsentContext.Provider value={props.store}>{props.children}</ConsentContext.Provider>;
}

function useConsentStore(): ConsentStore {
  const store = useContext(ConsentContext);
  if (!store) {
    throw new Error("ConsentProvider is missing above this component.");
  }
  return store;
}

export function useConsentRecord(): ConsentRecord | null {
  const store = useConsentStore();
  const [record, setRecord] = useState(store.read());
  useEffect(() => store.subscribe(() => setRecord(store.read())), [store]);
  return record;
}

export function useConsentCategory(category: ConsentCategory): boolean {
  const record = useConsentRecord();
  return isCategoryGranted(record, category);
}

export interface ConsentGateProps {
  category: ConsentCategory;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ConsentGate(props: ConsentGateProps) {
  const granted = useConsentCategory(props.category);
  if (!granted) return props.fallback ?? null;
  return props.children;
}

export function useConsentGatedLoader(category: ConsentCategory, load: ConsentLoader): void {
  const store = useConsentStore();
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(
    () => runConsentGatedLoader(store, category, () => loadRef.current()),
    [store, category],
  );
}

export function useConsentStoreInstance(): ConsentStore {
  return useConsentStore();
}
