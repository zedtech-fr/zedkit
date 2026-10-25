"use client";

import { useStaticSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";

/**
 * Static search dialog: queries the build-time index
 * (app/api/search/route.ts) in the browser — no server needed.
 */
export default function StaticSearchDialog(props: SharedProps) {
  // Advanced mode defaults to tolerance 0; enable 1-edit typo tolerance
  // (standard Cmd+K behaviour, simple mode already uses 1).
  const search = useStaticSearch({ search: { tolerance: 1 } });

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
