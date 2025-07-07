import BreadcrumbContext, {
  BreadcrumbRoute
} from "@renderer/app/view/components/breadcrumb_context";
import SettingCard from "@renderer/app/view/components/setting_menu_card";
import { Card, CardContent } from "@renderer/assets/shadcn/components/ui/card";
import { useRouteContext } from "@renderer/router";
import {
  BarChartHorizontalBig,
  FileSpreadsheet,
  LayoutGrid,
  LucideProps,
  SendToBack,
  Settings,
  SquareStack
} from "lucide-react";

export default function OrderImportExportMenuPage() {
  const { push } = useRouteContext();
  const routes = [
    {
      name: "Order Import",
      route: "/settings/order-menu/order-import",
      icon: <FileSpreadsheet />
    }
    // {
    //   name: "Order Export",
    //   route: "/settings/order-menu/order-export",
    //   icon: <FileSpreadsheet />
    // }
  ];
  return (
    <div className="p-5">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Order Menu", route: "/settings/order-menu" },
          { name: "Import & Export", route: "/settings/order-menu/order-import-export-menu" }
        ]}
      />
      <p className="text-lg">Order Import & Export</p>
      <div className="flex flex-wrap mt-3 ">
        {routes &&
          routes.map((element) => (
            <SettingCard
              key={element.route}
              name={element.name}
              route={element.route}
              Icon={element.icon}
            />
          ))}
      </div>
    </div>
  );
}
