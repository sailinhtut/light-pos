import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { base64ToArrayBuffer } from "@renderer/utils/encrypt_utils";
import { generateDownloadBytes } from "@renderer/utils/file_utils";
import React from "react";

export function Base64ImageViewer({
  title,
  base64String,
  children
}: {
  title: string;
  base64String: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <img
          src={`data:image/png;base64,${base64String}`}
          alt={title}
          className="w-auto h-auto aspect-auto rounded-lg border-slate-300 shadow"
        ></img>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"} size={"sm"}>
              Close
            </Button>
          </DialogClose>
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={async () => {
              await generateDownloadBytes(
                `${title}.png`,
                base64ToArrayBuffer(base64String),
                "image/png"
              );
            }}
          >
            Save In Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
