import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zedtech/zedkit-ui";

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger aria-label="Pick a region">
        <SelectValue placeholder="Pick a region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="eu">Europe</SelectItem>
        <SelectItem value="us">Americas</SelectItem>
      </SelectContent>
    </Select>
  );
}
