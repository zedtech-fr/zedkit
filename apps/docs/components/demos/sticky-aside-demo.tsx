"use client";

import { Button, Card, CardContent, Heading, StickyAside, Stack, Text } from "@zedtech/zedkit-ui";
import { stickyAsideCopy } from "@/components/demos/i18n/sticky-aside-copy";

const steps = stickyAsideCopy.example.steps;

export function StickyAsideDemo() {
  return (
    <StickyAside className="min-h-aside" side="right">
      <StickyAside.Main>
        <ol className="trim-margin flex list-none flex-col gap-stack-lg flush">
          {steps.map((step, index) => (
            <li key={step.title} className="content-shrink">
              <Stack gap="tight">
                <Text variant="muted" className="text-caption">
                  {stickyAsideCopy.example.stepLabel(index + 1)}
                </Text>
                <Heading level={3}>{step.title}</Heading>
                <Text variant="muted">{step.body}</Text>
              </Stack>
            </li>
          ))}
        </ol>
      </StickyAside.Main>
      <StickyAside.Aside asChild>
        <Card>
          <CardContent className="pt-card-padding">
            <Stack gap="sm" role="group" aria-label={stickyAsideCopy.example.renderedExample}>
              <Text className="text-caption font-medium text-muted-foreground">
                {stickyAsideCopy.example.renderedExample}
              </Text>
              <Button>{stickyAsideCopy.example.save}</Button>
            </Stack>
          </CardContent>
        </Card>
      </StickyAside.Aside>
    </StickyAside>
  );
}

export function StickyAsideDocStepsDemo() {
  return (
    <StickyAside side="left" from="md" ratio="2/5" scrollable>
      <StickyAside.Main>
        <Stack gap="md">
          <Heading level={3}>{stickyAsideCopy.docSteps.title}</Heading>
          <Text variant="muted">{stickyAsideCopy.docSteps.body}</Text>
        </Stack>
      </StickyAside.Main>
      <StickyAside.Aside>
        <Card>
          <CardContent className="pt-card-padding">
            <Text variant="muted">{stickyAsideCopy.docSteps.summary}</Text>
          </CardContent>
        </Card>
      </StickyAside.Aside>
    </StickyAside>
  );
}
