import type * as React from "react";
import { useFormContext } from "react-hook-form";

import { Button, type ButtonProps } from "./button.js";

export type FormSubmitProps = Omit<ButtonProps, "type"> & {
  /**
   * Label shown while the form submits. Defaults to `children`.
   * Both come from the caller (message catalog), never hard-coded.
   */
  pendingLabel?: React.ReactNode;
};

/**
 * Submit button wired to the enclosing form: disabled while the
 * submission is in flight, with an optional pending label.
 * Must render inside `<Form>` (uses the form context).
 */
export function FormSubmit({ pendingLabel, children, disabled, ...props }: FormSubmitProps) {
  const { formState } = useFormContext();
  const pending = formState.isSubmitting;
  return (
    <Button type="submit" disabled={disabled === true || pending} {...props}>
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </Button>
  );
}
