import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

const EVENTS = [
  "Order placed by Camille Rousseau.",
  "Payment captured for €101.50.",
  "Picking started in the warehouse.",
  "Linen shirt packed.",
  "Canvas tote packed.",
  "Wool socks packed.",
  "Label printed for Express shipping.",
  "Handover to the courier.",
  "Out for delivery, 2 working days.",
  "First delivery attempt missed.",
  "Second attempt scheduled.",
  "Delivered and signed.",
] as const;

export function DialogTallDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open long dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order activity</DialogTitle>
          <DialogDescription>Twelve events. The title stays put; the list and note scroll.</DialogDescription>
        </DialogHeader>
        <Stack gap={2} className="py-2">
          {EVENTS.map((line) => (
            <Text key={line} variant="muted">
              {line}
            </Text>
          ))}
          <Input aria-label="Note" placeholder="Add a note for the team" />
        </Stack>
        <DialogFooter>
          <Button>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
