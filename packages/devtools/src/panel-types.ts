export type DevtoolsBuildInfoRow = {
  label: string;
  value: string;
};

export type DevtoolsLocaleOption = {
  id: string;
  label: string;
};

export type ZedkitDevtoolsPanelProps = {
  flagKeys?: readonly string[];
  buildInfo?: readonly DevtoolsBuildInfoRow[];
  localeOptions?: readonly DevtoolsLocaleOption[];
  activeLocale?: string;
  onLocaleChange?: (localeId: string) => void;
  querySlot?: import("react").ReactNode;
  triggerLabel?: string;
};
