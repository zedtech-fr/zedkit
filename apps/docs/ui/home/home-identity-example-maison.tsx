"use client";

import { useId, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Input,
  Label,
  Stack,
  Switch,
  Text,
} from "@zedtech/zedkit-ui";
import { formatEur, homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.maison;

type Product = { id: string; name: string; material: string; price: number; stock: number; visible: boolean };

const INITIAL: Product[] = copy.products.map((product) => ({ ...product }));
const LOW_STOCK = 2;
const toNumber = (value: string) => Math.max(0, Number.parseInt(value, 10) || 0);

/** One piece: a pressed card picks it, the badge says how much is left. */
function ProductCard({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  return (
    <li className="grid content-shrink">
      <Button
        type="button"
        variant="outline"
        aria-pressed={selected}
        className="h-auto! min-h-target w-full flex-col items-start justify-start gap-stack-sm surface-pad-md text-left font-normal whitespace-normal"
        onClick={onSelect}
      >
        <span className="font-(family-name:--zk-font-display) text-xl">{product.name}</span>
        <span className="text-dense text-muted-foreground">{product.material}</span>
        <span className="flex w-full flex-wrap items-center justify-between gap-stack-sm">
          <span className="tabular-nums">{formatEur(product.price)}</span>
          <Badge variant={product.stock <= LOW_STOCK ? "warning" : "secondary"}>
            {product.stock <= LOW_STOCK ? copy.lowStock(product.stock) : copy.inStock(product.stock)}
          </Badge>
        </span>
        {product.visible ? null : <span className="text-xs text-muted-foreground">{copy.hidden}</span>}
      </Button>
    </li>
  );
}

/** Edits live in a draft until Save; `key` on the piece resets the draft when another one is picked. */
function ProductEditor({ product, onSave }: { product: Product; onSave: (next: Product) => void }) {
  const priceId = useId();
  const stockId = useId();
  const visibleId = useId();
  const [draft, setDraft] = useState(product);
  return (
    <Stack gap={3} className="content-shrink">
      <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
        {product.name}
      </Heading>
      <Stack gap={3} className="content-shrink sm:flex-row sm:flex-wrap sm:items-end">
        <Stack gap={1} className="content-shrink flex-1 basis-full sm:basis-number">
          <Label htmlFor={priceId}>{copy.priceLabel}</Label>
          <Input id={priceId} inputMode="numeric" value={draft.price} onChange={(event) => setDraft({ ...draft, price: toNumber(event.target.value) })} />
        </Stack>
        <Stack gap={1} className="content-shrink flex-1 basis-full sm:basis-number">
          <Label htmlFor={stockId}>{copy.stockLabel}</Label>
          <Input id={stockId} inputMode="numeric" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: toNumber(event.target.value) })} />
        </Stack>
        <Stack direction="horizontal" gap={2} className="min-h-target items-center">
          <Switch id={visibleId} checked={draft.visible} onCheckedChange={(visible) => setDraft({ ...draft, visible })} />
          <Label htmlFor={visibleId}>{copy.visibleLabel}</Label>
        </Stack>
      </Stack>
      <Button type="button" className="w-fit" onClick={() => onSave(draft)}>
        {copy.save}
      </Button>
    </Stack>
  );
}

export function HomeIdentityExampleMaison() {
  const [products, setProducts] = useState<Product[]>(INITIAL);
  const [selectedId, setSelectedId] = useState(INITIAL[0]!.id);
  const [message, setMessage] = useState("");
  const product = products.find((item) => item.id === selectedId) ?? products[0]!;
  const low = products.find((item) => item.stock <= LOW_STOCK);

  return (
    <Stack gap={5} className="content-shrink">
      <Stack gap={1}>
        <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
          {copy.heading}
        </Heading>
        <Text variant="muted">{copy.description}</Text>
      </Stack>
      <ul aria-label={copy.listAriaLabel} className="trim-margin grid list-none gap-stack-md flush sm:grid-trio">
        {products.map((item) => (
          <ProductCard
            key={item.id}
            product={item}
            selected={item.id === product.id}
            onSelect={() => {
              setSelectedId(item.id);
              setMessage("");
            }}
          />
        ))}
      </ul>
      <Card className="content-shrink">
        <CardContent className="content-offset">
          <ProductEditor
            key={product.id}
            product={product}
            onSave={(next) => {
              setProducts((list) => list.map((item) => (item.id === next.id ? next : item)));
              setMessage(copy.saved(next.name));
            }}
          />
          <Text variant="muted" role="status" data-home-identity-status="" className="mt-status empty:hidden">
            {message}
          </Text>
        </CardContent>
      </Card>
      {low ? (
        <Alert>
          <AlertTitle>{copy.alertTitle}</AlertTitle>
          <AlertDescription>{copy.alertBody(low.name, low.stock)}</AlertDescription>
        </Alert>
      ) : null}
    </Stack>
  );
}
