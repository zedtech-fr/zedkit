import { Button, Card, CardDescription, CardHeader, CardTitle, Stack } from "@zedtech/zedkit-ui";

export function MotionHoverDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Website relaunch</CardTitle>
          <CardDescription>Lifts on hover (devices that hover).</CardDescription>
        </CardHeader>
      </Card>
      <Stack direction="horizontal">
        <Button className="hover-press">Presses down on click</Button>
      </Stack>
    </Stack>
  );
}
