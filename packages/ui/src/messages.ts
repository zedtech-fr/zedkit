export type ZedkitUiMessages = {
  close: string;
  confirm: string;
  cancel: string;
  loading: string;
  progress: string;
  filter: string;
  empty: string;
  clearFilters: string;
  previous: string;
  next: string;
  /** Template with `{page}` and `{pageCount}`. */
  pageOf: string;
  /** Template with `{step}`, `{stepCount}`, and `{title}` (WizardSteps mobile summary). */
  wizardStepOf: string;
  copyToClipboard: string;
  copied: string;
  copyFailed: string;
  live: string;
  idle: string;
  options: string;
  /** Combobox / multi-select search field placeholder. */
  search: string;
  /** Visible list loading line (ellipsis). */
  loadingEllipsis: string;
  /** Spinner accessible name while options load. */
  loadingOptions: string;
  /** Appended to a picked multi-select row, e.g. " (selected)". */
  selectedSuffix: string;
  /** Chip remove control; template `{label}`. */
  removeItem: string;
  identity: string;
  identityDescription: string;
  identityDefault: string;
  identityDefaultSuffix: string;
  identityCustom: string;
  scrollableTable: string;
  offlineTitle: string;
  offlineBody: string;
  updated: string;
  justNow: string;
  pickDate: string;
  pickDateRange: string;
  /** Visible label of the mobile menu button (marketing header). */
  menu: string;
  /** Accessible name of the marketing header's main navigation. */
  mainNavigation: string;
  /** Accessible name of the language switch. */
  language: string;
  /** Visible label of the Jump to latest control. */
  jumpToLatest: string;
  locale: "en" | "fr";
  /** Chrome for the composed live agent console. */
  agentConsole: {
    sidebarTrigger: string;
    agentsNav: string;
    groupMain: string;
    groupLens: string;
    groupSecondPass: string;
    groupWorkflow: string;
    groupHelper: string;
    groupObserver: string;
    /** @deprecated Gates fold into Review lenses; kept for custom bundles. */
    groupGate: string;
    emptyTitle: string;
    emptyDescription: string;
    finalDecision: string;
    firstPass: string;
    superseded: string;
    outdated: string;
    secondPass: string;
    blocksMerge: string;
    allowsMerge: string;
    posted: string;
    decided: string;
    summary: string;
    mustChange: string;
    mustChangeEmpty: string;
    notes: string;
    dismissed: string;
    kept: string;
    downgraded: string;
    approved: string;
    transcript: string;
    noTranscriptTitle: string;
    noTranscriptDescription: string;
    /** Template with `{n}`. */
    confidence: string;
    postedReview: string;
    /** Template with `{n}`. */
    pr: string;
    started: string;
    duration: string;
    toolCalls: string;
    /** Template with `{n}`. */
    tools: string;
    /** Singular of `tools`. Template with `{n}`. */
    toolsOne: string;
    tokens: string;
    /** Template with `{in}` and `{out}`. */
    tokensInOut: string;
    lastActivity: string;
    toolBurst: string;
  };
  /** Named steps while an assistant answer is still being written. */
  streamStatus: {
    "reading-reference": string;
    "picking-palette": string;
    "picking-typography": string;
    "picking-spacing": string;
    "building-preview": string;
  };
};

export const zedkitUiMessagesEn: ZedkitUiMessages = {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
  loading: "Loading content",
  progress: "Progress",
  filter: "Filter…",
  empty: "No results.",
  clearFilters: "Clear filters",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {pageCount}",
  wizardStepOf: "Step {step} of {stepCount} · {title}",
  copyToClipboard: "Copy to clipboard",
  copied: "Copied",
  copyFailed: "Could not copy. Select the text instead.",
  live: "Live",
  idle: "Idle",
  options: "Options",
  search: "Search…",
  loadingEllipsis: "Loading content…",
  loadingOptions: "Loading options",
  selectedSuffix: " (selected)",
  removeItem: "Remove {label}",
  identity: "Identity",
  identityDescription: "The page behind this sheet updates as you choose.",
  identityDefault: "Default",
  identityDefaultSuffix: " (default)",
  identityCustom: "Custom",
  scrollableTable: "Scrollable table",
  offlineTitle: "You're offline.",
  offlineBody: "Changes will sync when you reconnect.",
  updated: "Updated",
  justNow: "just now",
  pickDate: "Pick a date",
  pickDateRange: "Pick a date range",
  menu: "Menu",
  mainNavigation: "Main navigation",
  language: "Language",
  jumpToLatest: "Jump to latest",
  locale: "en",
  agentConsole: {
    sidebarTrigger: "Agents",
    agentsNav: "Agents",
    groupMain: "Main flow",
    groupLens: "Review lenses",
    groupSecondPass: "Second pass",
    groupWorkflow: "Workflows",
    groupHelper: "Helpers",
    groupObserver: "Observers",
    groupGate: "Gates",
    emptyTitle: "No agents",
    emptyDescription: "This run has no items yet.",
    finalDecision: "Final decision",
    firstPass: "First pass",
    superseded: "Superseded",
    outdated: "Outdated",
    secondPass: "Second pass",
    blocksMerge: "Blocks merge",
    allowsMerge: "Does not block merge",
    posted: "Posted",
    decided: "Decided",
    summary: "Summary",
    mustChange: "Must change",
    mustChangeEmpty: "Nothing to change before merge",
    notes: "Notes",
    dismissed: "Dismissed",
    kept: "Kept",
    downgraded: "Downgraded",
    approved: "Approved",
    transcript: "Transcript",
    noTranscriptTitle: "No transcript",
    noTranscriptDescription: "This step left no readable transcript.",
    confidence: "{n}/10",
    postedReview: "Posted review",
    pr: "PR {n}",
    started: "Started (UTC)",
    duration: "Duration",
    toolCalls: "Tool calls",
    tools: "{n} tools",
    toolsOne: "{n} tool",
    tokens: "Tokens",
    tokensInOut: "{in} in / {out} out",
    lastActivity: "Last activity",
    toolBurst: "Tool calls",
  },
  streamStatus: {
    "reading-reference": "Reading the site",
    "picking-palette": "Choosing a palette",
    "picking-typography": "Choosing typography",
    "picking-spacing": "Choosing spacing",
    "building-preview": "Building the preview",
  },
};

export const zedkitUiMessagesFr: ZedkitUiMessages = {
  close: "Fermer",
  confirm: "Confirmer",
  cancel: "Annuler",
  loading: "Chargement du contenu",
  progress: "Progression",
  filter: "Filtrer…",
  empty: "Aucun résultat.",
  clearFilters: "Effacer les filtres",
  previous: "Précédent",
  next: "Suivant",
  pageOf: "Page {page} sur {pageCount}",
  wizardStepOf: "Étape {step} sur {stepCount} · {title}",
  copyToClipboard: "Copier dans le presse-papiers",
  copied: "Copié",
  copyFailed: "Impossible de copier. Sélectionnez le texte à la place.",
  live: "En direct",
  idle: "Inactif",
  options: "Choix",
  search: "Rechercher…",
  loadingEllipsis: "Chargement du contenu…",
  loadingOptions: "Chargement des options",
  selectedSuffix: " (sélectionné)",
  removeItem: "Retirer {label}",
  identity: "Identité",
  identityDescription: "La page derrière ce panneau se met à jour quand vous choisissez.",
  identityDefault: "Défaut",
  identityDefaultSuffix: " (défaut)",
  identityCustom: "Personnalisé",
  scrollableTable: "Tableau défilable",
  offlineTitle: "Vous êtes hors ligne.",
  offlineBody: "Les changements se synchroniseront à la reconnexion.",
  updated: "Mis à jour",
  justNow: "à l'instant",
  pickDate: "Choisir une date",
  pickDateRange: "Choisir une période",
  menu: "Menu",
  mainNavigation: "Navigation principale",
  language: "Langue",
  jumpToLatest: "Aller au plus récent",
  locale: "fr",
  agentConsole: {
    sidebarTrigger: "Agents",
    agentsNav: "Agents",
    groupMain: "Flux principal",
    groupLens: "Revues",
    groupSecondPass: "Second passage",
    groupWorkflow: "Workflows",
    groupHelper: "Assistants",
    groupObserver: "Observateurs",
    groupGate: "Contrôles",
    emptyTitle: "Aucun agent",
    emptyDescription: "Cette exécution n'a pas encore d'éléments.",
    finalDecision: "Décision finale",
    firstPass: "Premier passage",
    superseded: "Remplacé",
    outdated: "Obsolète",
    secondPass: "Second passage",
    blocksMerge: "Bloque la fusion",
    allowsMerge: "Ne bloque pas la fusion",
    posted: "Publié",
    decided: "Décidé",
    summary: "Résumé",
    mustChange: "À changer",
    mustChangeEmpty: "Rien à changer avant la fusion",
    notes: "Notes",
    dismissed: "Écarté",
    kept: "Conservé",
    downgraded: "Rétrogradé",
    approved: "Approuvé",
    transcript: "Transcription",
    noTranscriptTitle: "Aucune transcription",
    noTranscriptDescription: "Cette étape n'a laissé aucune transcription lisible.",
    confidence: "{n}/10",
    postedReview: "Revue publiée",
    pr: "PR {n}",
    started: "Début (UTC)",
    duration: "Durée",
    toolCalls: "Appels d'outils",
    tools: "{n} outils",
    toolsOne: "{n} outil",
    tokens: "Jetons",
    tokensInOut: "{in} entrants / {out} sortants",
    lastActivity: "Dernière activité",
    toolBurst: "Appels d'outils",
  },
  streamStatus: {
    "reading-reference": "Lecture du site",
    "picking-palette": "Choix de la palette",
    "picking-typography": "Choix de la typographie",
    "picking-spacing": "Choix de l'espacement",
    "building-preview": "Préparation de l'aperçu",
  },
};
