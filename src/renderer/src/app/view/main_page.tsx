import { Outlet } from "react-router-dom";
import NavBar from "./components/nav_bar";
import SideMenuBar from "./components/side_menu_bar";
import Footer from "./components/footer";
import { useRouteContext } from "@renderer/router";
import { useContext, useEffect } from "react";
import UserContext from "@renderer/auth/context/user_context";
import { ShopContext } from "@renderer/product/context/shop_context";
import { Toaster } from "@renderer/assets/shadcn/components/ui/toaster";
import { AppContext } from "../context/app_context";
import { offlineMode } from "@renderer/utils/app_constants";

export default function MainPage() {
  const { pushAndForgetPast } = useRouteContext();
  const userContext = useContext(UserContext);
  const shopContext = useContext(ShopContext);

  useEffect(function () {
    checkUserCredential();
  }, []);

  const checkUserCredential = async () => {
    if (offlineMode) {
      // const validatedOfflineCredential = localStorage.getItem("offline_validation");
      // if (!validatedOfflineCredential) {
      //   pushAndForgetPast("/sign-in-offline");
      //   return;
      // }
      shopContext.fetchData({
        backup: localStorage.getItem("backupData") === "true",
        minimumStockAlaram: localStorage.getItem("minimumStockAlarm") === "true"
      });
    } else {
      const authorized = await userContext.authorize();
      if (!authorized) {
        pushAndForgetPast("/sign-in");
        return;
      }

      shopContext.fetchData({
        backup: localStorage.getItem("backupData") === "true",
        minimumStockAlaram: localStorage.getItem("minimumStockAlarm") === "true"
      });
    }
  };

  return (
    <main className="w-screen h-screen overflow-hidden">
      <NavBar />
      <div className="flex flex-row">
        <SideMenuBar />
        <div className="w-[calc(100vw-180px)] h-[calc(100vh-33px)] overflow-auto">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
