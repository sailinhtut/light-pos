import { UserContextProvider } from "@renderer/auth/context/user_context";
import router from "../../router";
import AppContextProvider from "../context/app_context";
import { RouterProvider } from "react-router-dom";
import { ShopContextProvider } from "@renderer/product/context/shop_context";
import CartContextProvider from "@renderer/order/context/cart_context";
import LangagueContextProvider from "@renderer/language/context/langugage_context";

export default function AppRoot() {
  return (
    <LangagueContextProvider>
      <AppContextProvider>
        <UserContextProvider>
          <CartContextProvider>
            <ShopContextProvider>
              <RouterProvider router={router}></RouterProvider>
            </ShopContextProvider>
          </CartContextProvider>
        </UserContextProvider>
      </AppContextProvider>
    </LangagueContextProvider>
  );
}
