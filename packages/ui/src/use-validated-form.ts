import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";

/**
 * Validated form in one call: the zod schema is the single source of
 * truth (in a real app it lives in the shared contracts package next
 * to the API validators) and the resolver wiring stays inside the
 * kit, so consumers never import the resolver library directly.
 */
export function useValidatedForm<TFieldValues extends FieldValues>(
  schema: Parameters<typeof zodResolver>[0],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm's own context type (any)
  options: Omit<UseFormProps<TFieldValues, any>, "resolver"> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm's own context type (any)
): UseFormReturn<TFieldValues, any, TFieldValues> {
  // The resolver is exact for this schema, but react-hook-form's
  // Resolver is invariant in its options type, so a schema-typed
  // resolver cannot flow through the generic untouched (same
  // upstream-invariance situation as the data-table columns).
  const resolver = zodResolver(schema) as Resolver<TFieldValues>;
  return useForm<TFieldValues>({ ...options, resolver });
}
