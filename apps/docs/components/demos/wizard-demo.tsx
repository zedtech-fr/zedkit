"use client";

import { useState } from "react";
import { Button, OptionCards, Stack, Text, WizardSteps } from "@zedtech/zedkit-ui";

const STEPS = ["Products", "Shipping", "Launch"];

const PRODUCTS = [
  { id: "physical", title: "Physical products", description: "Clothes, home goods, anything you ship." },
  { id: "digital", title: "Digital downloads", description: "E-books, templates, presets." },
  { id: "services", title: "Services", description: "Bookings and one-off sessions." },
  { id: "gift", title: "Gift cards", description: "Let customers gift your store." },
];

const SHIPPING = [
  { id: "standard", title: "Standard", description: "3 to 5 working days, €4.90." },
  { id: "express", title: "Express", description: "Next working day, €9.90." },
  { id: "pickup", title: "Store pickup", description: "Free, ready in 2 hours." },
];

export function WizardDemo() {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState(["physical"]);
  const [shipping, setShipping] = useState(["standard"]);
  const picked = (list: typeof PRODUCTS, ids: string[]) =>
    list.filter((entry) => ids.includes(entry.id)).map((entry) => entry.title.toLowerCase());

  return (
    <Stack gap={4} className="min-w-0">
      <WizardSteps steps={STEPS} current={step} />
      {step === 0 ? (
        <OptionCards label="What will you sell?" options={PRODUCTS} selected={products} onChange={setProducts} />
      ) : null}
      {step === 1 ? (
        <OptionCards label="How will you deliver?" options={SHIPPING} selected={shipping} onChange={setShipping} />
      ) : null}
      {step === 2 ? (
        <Text role="status">
          Ready to open: {picked(PRODUCTS, products).join(", ") || "no products yet"}; delivery by{" "}
          {picked(SHIPPING, shipping).join(", ") || "none yet"}.
        </Text>
      ) : null}
      <Stack direction="horizontal" gap={2}>
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
