// Original work by the same author.
import { tryCatch } from "@zedtech/zedkit-core";

export const CONSENT_CATEGORIES = ["analytics", "marketing"] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord extends ConsentPreferences {
  updatedAt: number;
}

export interface ConsentStore {
  read(): ConsentRecord | null;
  write(preferences: ConsentPreferences): void;
  subscribe(listener: () => void): () => void;
}

export function isCategoryGranted(record: ConsentRecord | null, category: ConsentCategory): boolean {
  if (record === null) return false;
  return record[category];
}

export function createMemoryConsentStore(initial: ConsentRecord | null = null): ConsentStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    read: () => current,
    write: (preferences) => {
      current = { ...preferences, updatedAt: Date.now() };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export interface LocalStorageConsentOptions {
  key: string;
  storage?: Pick<Storage, "getItem" | "setItem">;
}

export function createLocalStorageConsentStore(options: LocalStorageConsentOptions): ConsentStore {
  const storage = options.storage ?? globalThis.localStorage;
  const memory = createMemoryConsentStore(null);

  const hydrate = () => {
    const raw = storage.getItem(options.key);
    if (!raw) return;
    const parsed = tryCatch(() => JSON.parse(raw) as ConsentRecord);
    if (!parsed.ok) return;
    const value = parsed.value;
    if (typeof value.analytics === "boolean" && typeof value.marketing === "boolean") {
      memory.write({ analytics: value.analytics, marketing: value.marketing });
    }
  };

  hydrate();

  return {
    read: () => memory.read(),
    write: (preferences) => {
      memory.write(preferences);
      const record = memory.read();
      if (record) storage.setItem(options.key, JSON.stringify(record));
    },
    subscribe: (listener) => memory.subscribe(listener),
  };
}
