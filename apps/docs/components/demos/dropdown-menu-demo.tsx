import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zedtech/zedkit-ui";

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Duplicate invoice</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Archive invoice</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
