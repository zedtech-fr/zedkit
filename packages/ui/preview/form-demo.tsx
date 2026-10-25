import { toast } from "sonner";
import { z } from "zod";
import { tryCatchAsync } from "@zedtech/zedkit-core";

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
  Toaster,
  useValidatedForm,
} from "#index.js";

/**
 * Every user-facing string arrives as props (the app's message
 * catalog), so this form renders any locale without code changes.
 */
export type FormDemoMessages = {
  nameLabel: string;
  nameDescription: string;
  nameTooShort: string;
  save: string;
  saving: string;
  saved: string;
  serverError: string;
};

export const defaultDemoMessages: FormDemoMessages = {
  nameLabel: "Display name",
  nameDescription: "Shown to other members of the workspace.",
  nameTooShort: "Use at least 2 characters.",
  save: "Save",
  saving: "Saving…",
  saved: "Saved.",
  serverError: "The server rejected this name.",
};

/**
 * In a real app the schema factory lives in the shared contracts
 * package next to the API validators (single source of truth); the
 * messages come from the app catalog, so validation stays localized.
 */
export function createDemoSchema(messages: Pick<FormDemoMessages, "nameTooShort">) {
  return z.object({ name: z.string().min(2, messages.nameTooShort) });
}

export type DemoValues = z.infer<ReturnType<typeof createDemoSchema>>;

async function defaultSave(): Promise<void> {}

export function FormDemo({
  messages = defaultDemoMessages,
  onSave = defaultSave,
}: {
  messages?: FormDemoMessages;
  onSave?: (values: DemoValues) => Promise<void>;
}) {
  const form = useValidatedForm<DemoValues>(createDemoSchema(messages), {
    defaultValues: { name: "" },
  });

  async function onSubmit(values: DemoValues): Promise<void> {
    const saved = await tryCatchAsync(() => onSave(values));
    if (saved.ok) {
      toast.success(messages.saved);
    } else {
      form.setError("name", { message: messages.serverError });
      toast.error(messages.serverError);
    }
  }

  return (
    <>
      <Toaster />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{messages.nameLabel}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{messages.nameDescription}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormSubmit pendingLabel={messages.saving}>{messages.save}</FormSubmit>
        </form>
      </Form>
    </>
  );
}
