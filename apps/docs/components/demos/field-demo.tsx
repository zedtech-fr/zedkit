"use client";

import * as React from "react";
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Stack,
  Text,
  Textarea,
} from "@zedtech/zedkit-ui";
import { fieldCopy } from "@/components/demos/i18n/field-copy";

function NotifyField() {
  return (
    <FieldLabel className="items-center">
      <Checkbox defaultChecked />
      <Text as="span">{fieldCopy.notifyLabel}</Text>
    </FieldLabel>
  );
}

export function FieldDemo() {
  const [name, setName] = React.useState<string>(fieldCopy.initialName);
  const [summary, setSummary] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [created, setCreated] = React.useState(false);
  const tooShort = name.trim().length < 3;
  const showError = submitted && tooShort;

  return (
    <form
      noValidate
      className="content-shrink"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        setCreated(!tooShort);
      }}
    >
      <FieldSet>
        <FieldLegend>{fieldCopy.legend}</FieldLegend>
        <FieldGroup>
          <Field data-invalid={showError}>
            <FieldLabel htmlFor="field-project-name">{fieldCopy.projectNameLabel}</FieldLabel>
            <Input
              id="field-project-name"
              value={name}
              aria-invalid={showError}
              aria-describedby="field-project-name-help"
              onChange={(event) => {
                setName(event.target.value);
                setCreated(false);
              }}
            />
            <FieldDescription id="field-project-name-help">{fieldCopy.projectNameHelp}</FieldDescription>
            {showError ? <FieldError errors={[{ message: fieldCopy.nameTooShort }]} /> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="field-project-summary">{fieldCopy.summaryLabel}</FieldLabel>
            <Textarea
              id="field-project-summary"
              value={summary}
              placeholder={fieldCopy.summaryPlaceholder}
              onChange={(event) => setSummary(event.target.value)}
            />
          </Field>
          <NotifyField />
        </FieldGroup>
        <Stack direction="horizontal" gap="md" className="items-center">
          <Button type="submit">{fieldCopy.submit}</Button>
          {created ? (
            <Text role="status" variant="muted">
              {fieldCopy.created(name.trim())}
            </Text>
          ) : null}
        </Stack>
      </FieldSet>
    </form>
  );
}
