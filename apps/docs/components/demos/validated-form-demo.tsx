"use client";

import { useState } from "react";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  Input,
  Text,
  useValidatedForm,
} from "@zedtech/zedkit-ui";

const schema = z.object({ name: z.string().min(2, "Use at least 2 characters.") });

export function ValidatedFormDemo() {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useValidatedForm<{ name: string }>(schema, { defaultValues: { name: "" } });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => setSaved(values.name))}
        className="max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Shown to other members of the workspace.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormSubmit pendingLabel="Saving…">Save</FormSubmit>
        {saved ? <Text variant="muted">Saved: {saved}</Text> : null}
      </form>
    </Form>
  );
}
