"use client";

import { useId, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Heading,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { HomeIdentityLooksControls } from "@/ui/home/home-identity-looks-controls";
import { HomeIdentityLooksMembers } from "@/ui/home/home-identity-looks-members";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const copy = homeIdentityLooksCopy.stage;

export function HomeIdentityLooksStage() {
  const workspaceId = useId();
  const regionId = useId();
  const alertsId = useId();
  const [workspace, setWorkspace] = useState<string>(copy.workspaceValue);
  const [region, setRegion] = useState<string>(copy.regionValue);
  const [alerts, setAlerts] = useState(true);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <Stack direction="horizontal" gap={2} className="items-start justify-between">
          <Stack gap={1} className="min-w-0">
            <Heading level={3} className="font-(family-name:--zk-font-display) text-balance">
              {copy.heading}
            </Heading>
            <Text variant="muted">{copy.description}</Text>
          </Stack>
          <Badge variant="success">{copy.status}</Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack gap={4} className="min-w-0">
          <HomeIdentityLooksControls
            workspaceId={workspaceId}
            regionId={regionId}
            alertsId={alertsId}
            workspace={workspace}
            region={region}
            alerts={alerts}
            onWorkspace={setWorkspace}
            onRegion={setRegion}
            onAlerts={setAlerts}
          />
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button type="button">{copy.save}</Button>
            <Button type="button" variant="secondary">
              {copy.discard}
            </Button>
            <Button type="button" variant="destructive">
              {copy.destroy}
            </Button>
          </Stack>
          <HomeIdentityLooksMembers />
          <Alert>
            <AlertTitle>{copy.alertTitle}</AlertTitle>
            <AlertDescription>{copy.alertBody}</AlertDescription>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
