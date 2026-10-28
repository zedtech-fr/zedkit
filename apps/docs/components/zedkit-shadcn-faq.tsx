import { Stack, Text } from "@zedtech/zedkit-ui";

import { registryBrickNames } from "@/content/registry-site";
import { zedkitShadcnFaq } from "@/lib/zedkit-shadcn-faq";

import { JsonLd } from "./json-ld";

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
      <Stack gap={6}>
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        {entries.map(({ question, answer }) => (
          <Stack key={question} gap={2}>
            <h3 className="text-lg font-medium">{question}</h3>
            <Text as="p" variant="muted">
              {answer}
            </Text>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
