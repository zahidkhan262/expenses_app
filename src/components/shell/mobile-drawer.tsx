"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/shell/nav";

export function MobileDrawer({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-dvh w-[18rem] max-w-[80vw] translate-x-0 translate-y-0 rounded-none border-l-0 p-0 [&>button[aria-label='Close']]:right-3 [&>button[aria-label='Close']]:top-3">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-border p-5">
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-3" onClick={() => setOpen(false)}>
            <SidebarNav isAdmin={isAdmin} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

