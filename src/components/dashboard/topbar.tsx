"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "./sidebar";
import { LogoutButton } from "./logout-button";

export function Topbar({
  isAdmin,
  planName,
  email,
}: {
  isAdmin: boolean;
  planName: string;
  email: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        {/* Мобильное меню */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню">
              <Menu className="h-5 w-5" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
            <Dialog.Content
              className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background p-4 md:hidden"
              onClick={() => setOpen(false)}
            >
              <Dialog.Title className="sr-only">Навигация</Dialog.Title>
              <div className="mb-2 flex justify-end">
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Закрыть">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>
              <Sidebar isAdmin={isAdmin} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Badge variant="secondary">Тариф: {planName}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {email}
        </span>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
