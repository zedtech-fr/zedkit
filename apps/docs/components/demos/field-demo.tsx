import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@zedtech/zedkit-ui";

export function FieldDemo() {
  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldDescription>Public, shown to the team.</FieldDescription>
          <FieldError errors={[{ message: "Too short." }]} />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
