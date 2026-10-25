import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

export function TabsDemo() {
  return (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">First</TabsTrigger>
        <TabsTrigger value="two">Second</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel.</TabsContent>
      <TabsContent value="two">Second panel.</TabsContent>
    </Tabs>
  );
}
