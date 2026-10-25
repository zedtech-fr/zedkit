import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zedtech/zedkit-ui";

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server</CardTitle>
        <CardDescription>Connection details.</CardDescription>
      </CardHeader>
      <CardContent>Body.</CardContent>
    </Card>
  );
}
