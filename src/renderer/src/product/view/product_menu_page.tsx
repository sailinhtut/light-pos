import BreadcrumbContext, {
  BreadcrumbRoute
} from "@renderer/app/view/components/breadcrumb_context";
import SettingCard from "@renderer/app/view/components/setting_menu_card";
import { Card, CardContent } from "@renderer/assets/shadcn/components/ui/card";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";
import { useRouteContext } from "@renderer/router";
import {
  BadgePercent,
  BarChartHorizontalBig,
  FileSpreadsheet,
  LayoutGrid,
  LucideProps,
  SendToBack,
  Settings,
  SquareStack
} from "lucide-react";
import { useContext } from "react";

export default function ProductMenuPage() {
  const { push } = useRouteContext();
  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

  return (
    <div className="p-5">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" }
        ]}
      />
      <p className="text-lg">Product Menu</p>
      <div className="flex flex-wrap mt-3 ">
        {!isCasher && (
          <SettingCard
            name="Product List"
            route="/settings/product-menu/product-list"
            Icon={<BarChartHorizontalBig />}
          />
        )}

        {!isCasher && (
          <SettingCard
            name="Update Price"
            route="/settings/product-menu/update-price"
            Icon={<BadgePercent />}
          />
        )}
        {!isCasher && (
          <SettingCard
            name="Import & Export"
            route="/settings/product-menu/product-import-export-menu"
            Icon={<FileSpreadsheet />}
          />
        )}
        <SettingCard
          name="Category"
          route="/settings/product-menu/category-list"
          Icon={<SquareStack />}
        />
        <SettingCard name="Unit" route="/settings/product-menu/unit-list" Icon={<SendToBack />} />
        <SettingCard
          name="Product Setting"
          route="/settings/product-menu/product-setting"
          Icon={<Settings />}
        />
      </div>
    </div>
  );
}
