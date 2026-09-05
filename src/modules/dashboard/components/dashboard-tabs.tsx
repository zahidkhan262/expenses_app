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
      <TabsList className="grid w-full grid-cols-2 sm:w-auto">
        <TabsTrigger value="overview" className="min-w-0">
          Overview
        </TabsTrigger>
        <TabsTrigger value="history" className="min-w-0">
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="history">
        <DashboardHistory />
      </TabsContent>
    </Tabs>
  );
}
