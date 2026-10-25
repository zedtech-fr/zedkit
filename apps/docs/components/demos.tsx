import { Badge, Button, LivePulse } from "@zedtech/zedkit-ui";

/**
 * Tested-example previews for the rich doc pages. Each demo renders the
 * REAL workspace component (same import a consumer writes); the docs
 * generator embeds these by manifest key, and the docs check fails if
 * a manifest demo stops existing here.
 */
export function ButtonDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button>Create app</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="outline">Details</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  );
}

export function BadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>beta</Badge>
      <Badge variant="secondary">12 events</Badge>
      <Badge variant="outline">stable</Badge>
    </div>
  );
}

export function LivePulseDemo() {
  return (
    <div className="flex gap-4">
      <LivePulse />
      <LivePulse active={false} />
    </div>
  );
}
