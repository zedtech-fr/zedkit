"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SecretField,
} from "@zedtech/zedkit-ui";
import { HOME_CARD_GRID_TWO_COL } from "@/ui/home/home-rhythm";

export function HomeInstallOrCopyCopy({
  packageInstallCmd,
  registryAddCmd,
}: {
  packageInstallCmd: string;
  registryAddCmd: string;
}) {
  return (
    <div className={HOME_CARD_GRID_TWO_COL}>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Install as packages</CardTitle>
        </CardHeader>
        <CardContent>
          <SecretField
            multiline
            value={packageInstallCmd}
            aria-label="Package install command"
            copyLabel="Copy package install command"
          />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Copy the source into your project</CardTitle>
        </CardHeader>
        <CardContent>
          <SecretField
            multiline
            value={registryAddCmd}
            aria-label="shadcn registry add command"
            copyLabel="Copy shadcn registry command"
          />
        </CardContent>
      </Card>
    </div>
  );
}
