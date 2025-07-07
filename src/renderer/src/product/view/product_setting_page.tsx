import { ChevronRight, Palette, Printer } from "lucide-react";

import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { ColorPicker } from "@renderer/app/view/components/color_picker";
import { useContext } from "react";
import { AppContext } from "@renderer/app/context/app_context";
import { parseNumber } from "@renderer/utils/general_utils";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";

export function ProductSettingPage() {
  const { reloadAppConfigs, minimumStockColor, minimumStockQuantity, isMinimumStockAlarm } =
    useContext(AppContext);

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Product Setting", route: "/settings/product-menu/product-setting" }
        ]}
      />
      <p className="text-lg">Product Setting</p>
      <div className="w-full max-w-[400px] mt-2 flex flex-col">
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Minimum Stock</p>
          <ValueInputDialog
            title="Currency"
            initValue={minimumStockQuantity}
            description="Enter currency name"
            actionTitle="Save"
            onSubmit={(value) => {
              if (value) {
                const quantity = parseNumber(value);
                localStorage.setItem("minimumStockQuantity", JSON.stringify(quantity ?? 25));
                reloadAppConfigs();
              }
            }}
          >
            <Button variant={"outline"} size={"sm"}>
              {minimumStockQuantity}
            </Button>
          </ValueInputDialog>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Minimum Stock Color</p>
          <ColorPicker
            initColor={minimumStockColor}
            onPicked={(hexValue) => {
              localStorage.setItem("minimumStockColor", hexValue);
              reloadAppConfigs();
            }}
          />
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Stock Alarm Notification</p>
          <Switch
            checked={isMinimumStockAlarm}
            onCheckedChange={(value) => {
              localStorage.setItem("minimumStockAlarm", value ? "true" : "false");
              reloadAppConfigs();
            }}
          ></Switch>
        </div>
      </div>
    </div>
  );
}
