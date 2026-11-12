import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { JsonLd } from "@/components/json-ld";
import { registryBrickNames } from "@/content/registry-site";

import { zedkitShadcnFaqCopy } from "../i18n/zedkit-shadcn-faq-copy";
import { zedkitShadcnFaq } from "../zedkit-shadcn-faq";

export function ZedkitShadcnFaq() {
  const entries = zedkitShadcnFaq(registryBrickNames.length);
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <>
      <JsonLd data={faqPage} />
      <Stack gap="list">
        <Heading level={2}>{zedkitShadcnFaqCopy.heading}</Heading>
        {entries.map(({ question, answer }) => (
          <Stack key={question} gap="sm">
            <Heading level={3}>{question}</Heading>
            <Text as="p" variant="muted">
              {answer}
            </Text>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
