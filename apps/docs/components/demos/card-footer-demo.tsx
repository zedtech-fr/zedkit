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
import { cardCopy } from "@/components/demos/i18n/card-copy";

/** A card whose footer holds the actions: publish now, or keep working. */
export function CardFooterDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardCopy.footer.title}</CardTitle>
        <CardDescription>{cardCopy.footer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap={2}>
          <Text variant="muted" className="text-xs">
            {cardCopy.footer.hint}
          </Text>
          <Text>{cardCopy.footer.body}</Text>
        </Stack>
      </CardContent>
      <CardFooter>
        <Stack direction="horizontal" gap={2}>
          <Button>{cardCopy.footer.publish}</Button>
          <Button variant="outline">{cardCopy.footer.saveDraft}</Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}
