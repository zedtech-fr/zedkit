"use client";

import { useId, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  ConfirmDialog,
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
  const [saved, setSaved] = useState({
    workspace: copy.workspaceValue as string,
    region: copy.regionValue as string,
    alerts: true,
  });
  const [status, setStatus] = useState("");
  const [deleted, setDeleted] = useState(false);
  const dirty = workspace !== saved.workspace || region !== saved.region || alerts !== saved.alerts;

  const edit = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setStatus("");
  };
  const save = () => {
    setSaved({ workspace, region, alerts });
    setStatus(copy.saved);
  };
  const discard = () => {
    setWorkspace(saved.workspace);
    setRegion(saved.region);
    setAlerts(saved.alerts);
    setStatus(copy.discarded);
  };

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
          <Badge variant={deleted ? "secondary" : "success"}>{deleted ? copy.deleted : copy.status}</Badge>
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
            onWorkspace={edit(setWorkspace)}
            onRegion={edit(setRegion)}
            onAlerts={edit(setAlerts)}
          />
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button type="button" onClick={save}>
              {copy.save}
            </Button>
            <Button type="button" variant="secondary" onClick={discard}>
              {copy.discard}
            </Button>
            {deleted ? (
              <Button type="button" variant="outline" onClick={() => setDeleted(false)}>
                {copy.restore}
              </Button>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="destructive">
                    {copy.destroy}
                  </Button>
                }
                title={copy.deleteTitle}
                description={copy.deleteDescription}
                confirmLabel={copy.deleteConfirm}
                onConfirm={() => setDeleted(true)}
              />
            )}
          </Stack>
          <Text variant="muted" role="status" data-home-identity-status="">
            {deleted ? copy.deletedMessage : status || (dirty ? copy.unsaved : "")}
          </Text>
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
