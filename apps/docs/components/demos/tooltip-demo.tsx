import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@zedtech/zedkit-ui";

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>Save</Button>
      </TooltipTrigger>
      <TooltipContent>Saves the invoice</TooltipContent>
    </Tooltip>
  );
}
