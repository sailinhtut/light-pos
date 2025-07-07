import BreadcrumbContext, { BreadcrumbRoute } from "./components/breadcrumb_context";
import { Card, CardContent, CardTitle } from "@renderer/assets/shadcn/components/ui/card";
import {
  ClipboardCheck,
  ClipboardList,
  Contact,
  Info,
  LayoutGrid,
  LibraryBig,
  LogOut,
  NotepadText,
  Settings,
  UserPlus,
  Users,
  Wallet
} from "lucide-react";
import { useRouteContext } from "@renderer/router";
import SettingCard from "./components/setting_menu_card";
import { companyFacebookPage, offlineMode } from "@renderer/utils/app_constants";
import { SignOutDialog } from "@renderer/auth/view/profile_page";
import AuthService from "@renderer/auth/service/auth_service";

import UserContext from "@renderer/auth/context/user_context";
import { useContext } from "react";
import { AppRoles } from "@renderer/auth/interface/roles";

export default function SettingPage() {
  const { push } = useRouteContext();
  const { setCurrentUser } = useContext(UserContext);
  
  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" }
        ]}
      />
      <p className="text-lg">Setting </p>
      <div className="flex flex-wrap mt-3">
        <SettingCard name="Products" route="/settings/product-menu" Icon={<LayoutGrid />} />
        {!isCasher && <SettingCard name="Supplier" route="/settings/supplier" Icon={<Contact />} />}
        {!isCasher && (
          <SettingCard name="Customer" route="/settings/customer" Icon={<UserPlus />} />
        )}
        {!isCasher && <SettingCard name="Cashflow" route="/settings/cashflow" Icon={<Wallet />} />}
        <SettingCard name="Credit Book" route="/settings/credit-book" Icon={<LibraryBig />} />
        <SettingCard name="Orders" route="/settings/order-menu" Icon={<ClipboardList />} />
        {offlineMode ? (
          <SignOutDialog
            onConfirmed={async () => {
              await AuthService.signOut();

              setCurrentUser(undefined);
              if (offlineMode) {
                push("/sign-in-offline");
              } else {
                push("/sign-in");
              }
            }}
          >
            <Card className="transition-all duration-300 active:scale-95 hover:-translate-y-1 p-0 group  mr-3 mb-3 dark:hover:border-primary">
              <CardContent className="p-0 h-[100px] w-[120px] flex flex-col items-center justify-center">
                <div className="">
                  <LogOut />
                </div>
                <p className="text-sm mt-2 line-clamp-1 select-none">Sign Out</p>
              </CardContent>
            </Card>
          </SignOutDialog>
        ) : (
          !isCasher && (
            <SettingCard name="Accounts" route="/settings/manage-accounts" Icon={<Users />} />
          )
        )}
        <SettingCard name="System Setting" route="/settings/system-setting" Icon={<Settings />} />
        <SettingCard name="About" route="/settings/about-us" Icon={<Info />} />
      </div>

      <div
        className="text-sm text-gray-400 absolute bottom-5 left-0 right-0 text-center block cursor-pointer hover:text-black transition-all "
        onClick={() => {
          window.open(companyFacebookPage);
        }}
      >
        Light App Studio &copy; All Right Reserved
      </div>
    </div>
  );
}
