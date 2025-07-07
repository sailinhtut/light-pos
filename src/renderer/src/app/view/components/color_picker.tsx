import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

export function ColorPicker({
  initColor,
  onPicked
}: {
  initColor: string | undefined | null;
  onPicked: (hex: string) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(initColor ?? "#ffffff");
  const [open, setOpen] = useState(false);

  const selectColor = () => {
    onPicked(selectedColor);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button size={"sm"} variant={"outline"}>
          Choose Color
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[235px]">
        <div className="flex justify-between gap-3">
          <div className="">Select Color</div>
          <div
            className={`h-8 w-12 rounded-3xl border border-slate-500`}
            style={{ backgroundColor: selectedColor }}
          ></div>
        </div>
        <Input
          placeholder="#Color"
          value={selectedColor}
          className="my-2"
          onChange={(event) => setSelectedColor(event.target.value)}
        ></Input>
        <HexColorPicker color={selectedColor} onChange={(newColor) => setSelectedColor(newColor)} />

        <Button
          size={"sm"}
          className="w-full mt-3"
          variant={"outline"}
          onClick={() => {
            selectColor();
          }}
        >
          Choose Color
        </Button>
      </PopoverContent>
    </Popover>
  );
}
