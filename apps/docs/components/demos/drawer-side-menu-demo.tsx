import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Stack,
} from "@zedtech/zedkit-ui";

const LINKS = ["Dashboard", "Projects", "Team", "Billing", "Settings"] as const;

export function DrawerSideMenuDemo() {
  return (
    <Drawer direction="left" mobile="side">
      <DrawerTrigger asChild>
        <Button variant="outline">Menu</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <Stack direction="horizontal" gap={2} className="items-center justify-between">
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerCloseButton />
          </Stack>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={1} className="py-3">
            {LINKS.map((link) => (
              <Button key={link} variant="ghost" className="justify-start">
                {link}
              </Button>
            ))}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
