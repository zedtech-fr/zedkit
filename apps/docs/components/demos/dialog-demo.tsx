import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
        <DialogTitle>Details</DialogTitle>
        <DialogDescription>A modal dialog rendered from the kit.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
