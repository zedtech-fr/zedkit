import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DetailPanel,
  ProgressBar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@zedtech/zedkit-ui";

const tasks = [
  { name: "Homepage layout", status: "Done", tone: "success" },
  { name: "Case study pages", status: "In review", tone: "warning" },
  { name: "Contact form", status: "Active", tone: "secondary" },
  { name: "Launch checklist", status: "To do", tone: "outline" },
] as const;

const activity = [
  { who: "Leo Martin", what: "moved “Case study pages” to In review", when: "10 min ago" },
  { who: "Maya Laurent", what: "closed “Homepage layout”", when: "2 h ago" },
  { who: "Sam Okafor", what: "commented on “Contact form”", when: "Yesterday" },
] as const;

/** A project page: one heading, three panels that share its context. */
export function TabsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Website relaunch</CardTitle>
        <CardDescription>Harbor Studio · due 14 November</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Project sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Stack gap={4}>
              <ProgressBar value={55} label="Project progress, 55 percent" />
              <Text variant="muted">11 of 20 tasks done</Text>
              <DetailPanel
                items={[
                  { label: "Owner", value: "Maya Laurent" },
                  { label: "Team", value: "4 people" },
                  { label: "Status", value: <Badge variant="success">On track</Badge> },
                  { label: "Next milestone", value: "Design review, 3 November" },
                ]}
              />
            </Stack>
          </TabsContent>

          <TabsContent value="tasks">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.name}>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <Badge variant={task.tone}>{task.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="activity">
            <Stack gap={3}>
              {activity.map((entry) => (
                <Stack key={entry.what} gap={1}>
                  <Text>
                    <strong>{entry.who}</strong> {entry.what}
                  </Text>
                  <Text variant="muted">{entry.when}</Text>
                </Stack>
              ))}
            </Stack>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
