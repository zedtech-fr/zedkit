import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

/** A card whose footer holds the actions: publish now, or keep working. */
export function CardFooterDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spring collection</CardTitle>
        <CardDescription>12 products, last edited 2 hours ago</CardDescription>
      </CardHeader>
      <CardContent>
        <Text>This page is still a draft. Publishing makes it visible to every customer.</Text>
      </CardContent>
      <CardFooter>
        <Stack direction="horizontal" gap={2}>
          <Button>Publish</Button>
          <Button variant="outline">Save as draft</Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}
