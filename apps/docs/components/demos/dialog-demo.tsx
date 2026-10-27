import {
  Badge,
  Button,
  DetailPanel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zedtech/zedkit-ui";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order details</DialogTitle>
          <DialogDescription>Order #1042, placed on 26 October by Camille Rousseau.</DialogDescription>
        </DialogHeader>
        <DetailPanel
          items={[
            { label: "Items", value: "3 (Linen shirt, Canvas tote, Wool socks)" },
            { label: "Shipping", value: "Express, 2 working days" },
            { label: "Total", value: "€101.50" },
            { label: "Status", value: <Badge variant="warning">Awaiting shipment</Badge> },
          ]}
        />
        <DialogFooter>
          <Button variant="outline">Download invoice</Button>
          <Button>Mark as shipped</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
