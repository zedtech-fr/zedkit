"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@zedtech/zedkit-ui";

import type { AdminDashboardFormControl } from "./admin-dashboard-demo-form";

export function AdminDashboardDemoDrawerFields({
  form,
}: {
  form: AdminDashboardFormControl;
}) {
  return (
    <Stack gap={4} className="py-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Region</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a region" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="eu">eu</SelectItem>
                <SelectItem value="us">us</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </Stack>
  );
}
