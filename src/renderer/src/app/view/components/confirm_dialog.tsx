import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { useState } from "react";

export function ConfirmDialog({
  onConfirm,
  title = "Confirm",
  description,
  actionTitle = "Confirm",
  actionVariant = "default",
  children
}: {
  onConfirm?: () => void;
  title?: string;
  description?: string;
  actionTitle?: string;
  children?: React.ReactNode;
  actionVariant:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button
            variant={actionVariant}
            onClick={() => {
              setOpen(false);
              onConfirm?.();
            }}
          >
            {actionTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
