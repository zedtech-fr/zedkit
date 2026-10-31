"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Label,
  Stack,
} from "@zedtech/zedkit-ui";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_GALLERY_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

function PreviewScope({ children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-home-gallery-preview=""
      data-identity-scope=""
      data-identity={DEFAULT_IDENTITY}
      className={HOME_GALLERY_PREVIEW_SHELL_CLASS}
      {...props}
    >
      {children}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <PreviewScope>{children}</PreviewScope>;
}

export function HomeBadgePreview() {
  return (
    <Shell>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Badge>beta</Badge>
        <Badge variant="secondary">12 events</Badge>
        <Badge variant="outline">stable</Badge>
      </Stack>
    </Shell>
  );
}

export function HomeButtonPreview() {
  return (
    <Shell>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button size="sm">Create app</Button>
        <Button size="sm" variant="secondary">
          Cancel
        </Button>
        <Button size="sm" variant="outline">
          Details
        </Button>
      </Stack>
    </Shell>
  );
}

export function HomeInputPreview() {
  return (
    <Shell>
      <Stack gap={2} className="min-w-0">
        <Label htmlFor="home-gallery-email">Email address</Label>
        <Input id="home-gallery-email" type="email" autoComplete="email" placeholder="camille@example.com" />
      </Stack>
    </Shell>
  );
}

export function HomeDrawerPreview() {
  return (
    <Shell>
      <Drawer direction="right" mobile="sheet">
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            Open drawer
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Task details</DrawerTitle>
            <DrawerDescription>Website relaunch · preview panel.</DrawerDescription>
            <DrawerCloseButton className="absolute top-3 right-3" />
          </DrawerHeader>
          <DrawerBody>
            <Stack gap={2} className="py-2">
              <Badge variant="warning">In review</Badge>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button size="sm">Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Shell>
  );
}

export function HomeConfirmDialogPreview() {
  return (
    <Shell>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" size="sm">
            Delete item
          </Button>
        }
        title="Delete this project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => undefined}
      />
    </Shell>
  );
}

export function HomeThemePreview() {
  return (
    <Shell>
      <Card className="min-w-0 shadow-none">
        <CardHeader className="gap-1 p-3 pb-0">
          <CardDescription>Orders this week</CardDescription>
          <CardTitle className="text-lg">1,284</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Badge variant="success">+8%</Badge>
            <Badge variant="outline">Oct 20–26</Badge>
          </Stack>
        </CardContent>
      </Card>
    </Shell>
  );
}
