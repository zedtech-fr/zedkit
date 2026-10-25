import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";

export function HomeProofs({
  packages,
  needs,
  uiComponents,
  livePreviews,
  themeHref,
}: {
  packages: number;
  needs: number;
  uiComponents: number;
  livePreviews: number;
  themeHref: string;
}) {
  const items = [
    {
      title: `${uiComponents} UI catalog entries`,
      body: `${livePreviews} ship a live preview on their doc page (manifest-driven demos).`,
    },
    {
      title: `${packages} packages, ${needs} needs`,
      body: "Counts come from docs/catalog/catalog.json; the docs check fails when pages drift.",
    },
    {
      title: "Light and dark theme",
      body: "Class-based `.dark` tokens; toggle in the header matches the admin kit pattern.",
      href: themeHref,
      linkLabel: "Theme setup page",
    },
    {
      title: "Accessibility checks",
      body: "@zedtech/zedkit-ui runs vitest-axe on rendered components in packages/ui/tests/unit.",
      href: "https://github.com/zedtech-fr/zedkit/tree/main/packages/ui/tests/unit/a11y.test.tsx",
      linkLabel: "axe test suite",
      external: true,
    },
  ];
  return (
    <Section title="What you can verify">
      <Stack className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap={2}>
                <Text className="text-sm">{item.body}</Text>
                {item.href ? (
                  <Link href={item.href} {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                    <Text className="text-sm font-medium underline-offset-4 hover:underline">
                      {item.linkLabel}
                    </Text>
                  </Link>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Section>
  );
}
