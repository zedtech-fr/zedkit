"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

type SchemaForResolver = Parameters<typeof zodResolver>[0];
type InputOf<TSchema extends SchemaForResolver> = z.input<TSchema & z.ZodTypeAny> & FieldValues;
type OutputOf<TSchema extends SchemaForResolver> = z.output<TSchema & z.ZodTypeAny> & FieldValues;

/**
 * Validated form in one call: the zod schema is the single source of
 * truth (in a real app it lives in the shared contracts package next
 * to the API validators) and the resolver wiring stays inside the
 * kit, so consumers never import the resolver library directly.
 */
export function useValidatedForm<TSchema extends SchemaForResolver>(
  schema: TSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm's own context type (any)
  options: Omit<UseFormProps<InputOf<TSchema>, any, OutputOf<TSchema>>, "resolver"> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm's own context type (any)
): UseFormReturn<InputOf<TSchema>, any, OutputOf<TSchema>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm context generic
  const resolver = zodResolver(schema) as unknown as Resolver<InputOf<TSchema>, any, OutputOf<TSchema>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors useForm context generic
  return useForm<InputOf<TSchema>, any, OutputOf<TSchema>>({ ...options, resolver });
}
