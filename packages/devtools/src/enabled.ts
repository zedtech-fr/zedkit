export type DevtoolsEnabledOptions = {
  /** When true, mount even if `NODE_ENV` is production (local demos only). */
  force?: boolean;
  nodeEnv?: string | undefined;
};

export function devtoolsEnabled(options: DevtoolsEnabledOptions = {}): boolean {
  if (options.force) return true;
  const env = options.nodeEnv ?? (typeof process !== "undefined" ? process.env.NODE_ENV : undefined);
  return env !== "production";
}
