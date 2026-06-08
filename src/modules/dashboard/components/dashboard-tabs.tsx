"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHistory } from "@/modules/dashboard/components/dashboard-history";

export function DashboardTabs({
  overview,
}: {
  overview: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="overview" className="mt-5">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="history">
        <DashboardHistory />
      </TabsContent>
    </Tabs>
  );
}
