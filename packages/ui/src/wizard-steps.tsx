"use client";

import type * as React from "react";

import { CheckIcon } from "lucide-react";

import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface WizardStepsProps {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
  className?: string;
}

export type WizardStepState = "done" | "current" | "todo";

export interface WizardStepProps {
  step: string;
  /** 0-based position; shown as a number when not done. */
  index: number;
  state: WizardStepState;
  /** Trailing connector to the next step (omit on the last step). */
  showConnector?: boolean;
  className?: string;
}

/**
 * One step row (badge + label + optional connector). Compose custom
 * step lists with these inside your own `<ol>`; `WizardSteps` covers
 * the plain `steps[]` case.
 */
export function WizardStep({ step, index, state, showConnector = false, className }: WizardStepProps) {
  return (
    <li
      data-slot="wizard-step"
      aria-current={state === "current" ? "step" : undefined}
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-wizard-step-badge items-center justify-center rounded-full border text-xs font-medium",
          state === "done" && "border-primary bg-primary text-primary-foreground",
          state === "current" && "border-primary text-primary",
          state === "todo" && "text-muted-foreground",
        )}
      >
        {state === "done" ? <CheckIcon className="size-icon-sm" /> : index + 1}
      </span>
      <span className={cn(state === "current" ? "font-medium" : "text-muted-foreground")}>{step}</span>
      {showConnector ? (
        <span
          aria-hidden
          className="ml-wizard-step-connector-gap h-wizard-step-connector-thickness w-wizard-step-connector bg-border"
        />
      ) : null}
    </li>
  );
}

export type WizardProps = React.ComponentProps<"ol">;

/**
 * Step list container for composed `WizardStep` rows. `WizardSteps`
 * covers the plain `steps[]` case with the same markup.
 */
export function Wizard({ children, className, ...props }: WizardProps) {
  const messages = useUiMessages();
  return (
    <ol
      data-slot="wizard"
      className={cn("flex flex-wrap items-center gap-x-wizard-steps-gap gap-y-2", className)}
      aria-label={messages.progress}
      {...props}
    >
      {children}
    </ol>
  );
}

function stepState(index: number, current: number): WizardStepState {
  if (index < current) return "done";
  if (index === current) return "current";
  return "todo";
}

export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  return (
    <Wizard data-slot="wizard-steps" {...(className === undefined ? {} : { className })}>
      {steps.map((step, index) => (
        <WizardStep
          key={step}
          step={step}
          index={index}
          state={stepState(index, current)}
          showConnector={index < steps.length - 1}
        />
      ))}
    </Wizard>
  );
}
