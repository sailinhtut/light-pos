import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { parseNumber } from "@renderer/utils/general_utils";
import { useContext, useEffect } from "react";
import { AppContext } from "@renderer/app/context/app_context";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";

export function OrderSettingPage() {
  const { reloadAppConfigs, autoCheckOut, autoCheckOutSecond, customCheckOut } =
    useContext(AppContext);

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Order Menu", route: "/settings/order-menu" },
          { name: "Order Setting", route: "/settings/order-menu/order-setting" }
        ]}
      />
      <p className="text-lg">Order Setting</p>

      <div className="w-full max-w-[400px] mt-2 flex flex-col">
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Custom Check Out</p>
          <Switch
            checked={customCheckOut}
            onCheckedChange={(value) => {
              localStorage.setItem("customCheckOut", value ? "true" : "false");
              reloadAppConfigs();
            }}
          ></Switch>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Auto Check Out</p>
          <Switch
            checked={autoCheckOut}
            onCheckedChange={(value) => {
              localStorage.setItem("autoCheckOut", value ? "true" : "false");
              reloadAppConfigs();
            }}
          ></Switch>
        </div>
        <div className="h-[40px] flex items-center gap-3 justify-between  ">
          <p className="text-sm">Auto Check Out Seconds</p>
          <ValueInputDialog
            title="Auto Check Out"
            description="Enter seconds to check out automatically"
            actionTitle="Save"
            onSubmit={(value) => {
              if (value) {
                const quantity = parseNumber(value);
                localStorage.setItem("autoCheckOutSecond", JSON.stringify(quantity ?? 25));
                reloadAppConfigs();
              }
            }}
          >
            <Button variant={"outline"} size={"sm"}>
              {autoCheckOutSecond}
            </Button>
          </ValueInputDialog>
        </div>
      </div>
    </div>
  );
}
