import { loader } from "fumadocs-core/source";
import { statusBadgesPlugin } from "fumadocs-core/source/plugins/status-badges";
import { Badge } from "@zedtech/zedkit-ui";
import { docs } from "@/.source/server";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [
    statusBadgesPlugin({
      renderBadge: (status) => <Badge>{status}</Badge>,
    }),
  ],
});
