"use client";

import * as React from "react";
import { Wallet, ArrowLeftRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatInr } from "@/utils/currency";

export function BorrowStatCard({
  borrowGiven,
  borrowTaken,
}: {
  borrowGiven: number;
  borrowTaken: number;
}) {
  const [showGiven, setShowGiven] = React.useState(false);

  const title = showGiven ? "They owe you" : "You owe them";
  const amount = showGiven ? borrowGiven : borrowTaken;
  const subtitle = showGiven ? "Total money given" : "Total money taken";
  const iconClass = showGiven ? "text-emerald-600" : "text-sky-600";
  const bgClass = showGiven
    ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-background to-teal-50/60 dark:border-border dark:from-background dark:to-background"
    : "border-sky-200/70 bg-gradient-to-br from-sky-50 via-background to-cyan-50/60 dark:border-border dark:from-background dark:to-background";

  return (
    <Card className={cn("transition-transform hover:-translate-y-0.5 hover:shadow-md relative", bgClass)}>
      <CardHeader className="flex-row items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                setShowGiven(!showGiven);
              }}
              title="Toggle given/taken"
            >
              <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <p className="break-words text-lg font-semibold tracking-tight sm:text-xl">
            {formatInr(amount)}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-[var(--radius)] border border-border bg-accent/60 p-2 text-muted-foreground">
          <Wallet className={cn("h-5 w-5", iconClass)} />
        </span>
      </CardHeader>
    </Card>
  );
}
