import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import SettingCard from "@renderer/app/view/components/setting_menu_card";
import { useRouteContext } from "@renderer/router";
import { FileSpreadsheet, LayoutGrid, Settings } from "lucide-react";

export default function OrderMenuPage() {
  const { push } = useRouteContext();
  const routes = [
    {
      name: "Import & Export",
      route: "/settings/order-menu/order-import-export-menu",
      icon: <FileSpreadsheet />
    },
    {
      name: "Order Setting",
      route: "/settings/order-menu/order-setting",
      icon: <Settings />
    }
  ];
  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Order Menu", route: "/settings/order-menu" }
        ]}
      />
      <p className="text-lg">Order Menu</p>
      <div className="flex flex-wrap mt-3">
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
