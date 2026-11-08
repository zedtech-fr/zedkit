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
import { homeCopy } from "@/ui/home/i18n/home-copy";

const g = homeCopy.galleryPreview;

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
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Badge>{g.badge.beta}</Badge>
        <Badge variant="secondary">{g.badge.events}</Badge>
        <Badge variant="outline">{g.badge.stable}</Badge>
      </Stack>
    </Shell>
  );
}

export function HomeButtonPreview() {
  return (
    <Shell>
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Button size="sm">{g.button.createApp}</Button>
        <Button size="sm" variant="secondary">
          {g.button.cancel}
        </Button>
        <Button size="sm" variant="outline">
          {g.button.details}
        </Button>
      </Stack>
    </Shell>
  );
}

export function HomeInputPreview() {
  return (
    <Shell>
      <Stack gap="sm" className="content-shrink">
        <Label htmlFor="home-gallery-email">{g.input.label}</Label>
        <Input id="home-gallery-email" type="email" autoComplete="email" placeholder={g.input.placeholder} />
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
            {g.drawer.open}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>{g.drawer.title}</DrawerTitle>
            <DrawerDescription>{g.drawer.description}</DrawerDescription>
            <DrawerCloseButton className="absolute top-control-inline right-control-inline" />
          </DrawerHeader>
          <DrawerBody>
            <Stack gap="sm" className="surface-pad-block-sm">
              <Badge variant="warning">{g.drawer.inReview}</Badge>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button size="sm">{g.drawer.save}</Button>
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
            {g.confirm.trigger}
          </Button>
        }
        title={g.confirm.title}
        description={g.confirm.description}
        confirmLabel={g.confirm.confirm}
        onConfirm={() => undefined}
      />
    </Shell>
  );
}

export function HomeThemePreview() {
  return (
    <Shell>
      <Card className="content-shrink shadow-none">
        <CardHeader className="gap-stack-tight surface-pad-compact trim-pad-bottom">
          <CardDescription>{g.themeCard.description}</CardDescription>
          <CardTitle className="text-preview-title">{g.themeCard.title}</CardTitle>
        </CardHeader>
        <CardContent data-theme-card-body="" className="surface-pad-compact">
          <Stack direction="horizontal" gap="sm" className="flex-wrap">
            <Badge variant="success">{g.themeCard.successBadge}</Badge>
            <Badge variant="outline">{g.themeCard.rangeBadge}</Badge>
          </Stack>
        </CardContent>
      </Card>
    </Shell>
  );
}
