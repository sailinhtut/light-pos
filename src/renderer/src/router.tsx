import {
  NavigateOptions,
  createBrowserRouter,
  createHashRouter,
  createSearchParams,
  useNavigate
} from "react-router-dom";
import MainPage from "./app/view/main_page";
import DashboardPage from "./app/view/dashboard_page";
import CategoryListPage from "./product/view/category_list_page";
import UnitListPage from "./product/view/unit_list_page";

import SettingPage from "./app/view/setting_page";
import { useState } from "react";
import SignInPage from "./auth/view/sign_in_page";
import SignUpPage from "./auth/view/sign_up_page";
import ProfilePage from "./auth/view/profile_page";
import ProductMenuPage from "./product/view/product_menu_page";
import SupplierListPage from "./supplier/view/supplier_landing_screen";
import CustomerListPage from "./customer/view/customer_landing_screen";
import CashflowLandingPage from "./cashflow/view/cashflow_landing_screen";
import CreditbookListPage from "./credit_book/view/credit_book_landing_screen";
import CreditbookDetailPage from "./credit_book/view/credit_book_detail_screen";
import AccountManagementPage from "./users/view/account_landing_page";
import ItemLandingPage from "./product/view/item_landing_page";
import ItemListPage from "./product/view/item_list_page";
import ErrorPage from "./app/view/error_page";
import OrderHistoryPage from "./order/view/order_history_page";
import OrderActivePage from "./order/view/order_active_page";
import OrderMenuPage from "./order/view/order_menu_page";
import { OrderActiveDetailPage } from "./order/view/order_active_detail_page";
import { OrderHistoryDetailPage } from "./order/view/order_history_detail_page";
import { SystemSettingPage } from "./app/view/system_setting_page";
import { ThemeSettingPage } from "./app/view/theme_setting_page";
import OrderListPage from "./order/view/order_list_page";
import CashflowListPage from "./cashflow/view/cashflow_list_screen";
import { MinimumStockItemsPage } from "./product/view/minimum_stock_item_page";
import { ExpiredStockItemsPage } from "./product/view/expired_item_page";
import ProductImportExportMenuPage from "./product/view/product_export_import_menu_page";
import { ProductExportScreen } from "./product/view/product_export_page";
import { ProductImportScreen } from "./product/view/product_import_page";
import ProductPriceUpdatePage from "./product/view/product_price_update_page";
import { AboutUsPage } from "./app/view/about_us_page";
import { ClearDataPage } from "./app/view/clear_data_page";
import { ClearOrderDataPage } from "./app/view/clear_order_data_page";
import OrderExportPage from "./order/view/order_export_page";
import OrderImportExportMenuPage from "./order/view/order_export_import_menu_page";
import { OrderSettingPage } from "./order/view/order_setting_page";
import { ProductSettingPage } from "./product/view/product_setting_page";
import { OrderImportPage } from "./order/view/order_import_page";
import { OrderActiveOfflineDetailPage } from "./order/view/order_active_detail_offline_page";
import OrderHistoryOfflinePage from "./order/view/order_history_offline_page";
import { OrderHistoryDetailOfflinePage } from "./order/view/order_history_detail_offline_page";
import OfflineSignInPage from "./auth/view/offline_sign_in_page";
import { PrinterSettingPage } from "./app/view/printer_setting_page";

export function useRouteContext() {
  const navigate = useNavigate();
  const [markedRoutes, setMarkRoutes] = useState<string[]>([]);

  const canPop = () => markedRoutes.length > 0;

  const push = (route: string, params?: object, options?: NavigateOptions | undefined) => {
    setMarkRoutes([...markedRoutes, route]);

    navigate(`${route}${params ? `?${createSearchParams({ ...params })}` : ""}`);
  };

  const pushAndForgetPast = (route: string, options?: NavigateOptions | undefined) => {
    setMarkRoutes([route]);
    navigate(route, options);
  };

  const pop = () => {
    if (markedRoutes.length === 0) {
      return;
    }
    const updatedMarkedRoutes = markedRoutes.slice(0, -1);
    setMarkRoutes(updatedMarkedRoutes);
    navigate(-1);
  };

  return { push, pushAndForgetPast, pop, canPop };
}

const router = createHashRouter([
  {
    path: "/",
    element: <MainPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <ItemLandingPage />
      },
      {
        path: "/dashboard",
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: "/dashboard/minimum-stock-items",
            element: <MinimumStockItemsPage />
          },
          {
            path: "/dashboard/expired-items",
            element: <ExpiredStockItemsPage />
          }
        ]
      },
      {
        path: "/order-active",
        children: [
          {
            index: true,
            element: <OrderActivePage />
          },
          {
            path: "/order-active/:orderId",
            element: <OrderActiveDetailPage />
          }
        ]
      },
      {
        path: "/order-active-offline",
        children: [
          {
            index: true,
            element: <OrderActiveOfflineDetailPage />
          },
          {
            path: "/order-active-offline/:orderId",
            element: <OrderActiveOfflineDetailPage />
          }
        ]
      },
      {
        path: "/order-history",
        children: [
          {
            index: true,
            element: <OrderHistoryPage />
          },
          {
            path: "/order-history/:date?",
            element: <OrderHistoryPage />
          },
          {
            path: "/order-history/:date?/:orderId?",
            element: <OrderHistoryDetailPage />
          },
          {
            path: "/order-history/credit-book/:creditBookId",
            element: <CreditbookDetailPage />
          }
        ]
      },
      {
        path: "/order-history-offline",
        children: [
          {
            index: true,
            element: <OrderHistoryOfflinePage />
          },
          {
            path: "/order-history-offline/:date?",
            element: <OrderHistoryOfflinePage />
          },
          {
            path: "/order-history-offline/:date?/:orderId?",
            element: <OrderHistoryDetailOfflinePage />
          }
        ]
      },
      {
        path: "/order-list",
        element: <OrderListPage />
      },
      {
        path: "/cashflow-list",
        element: <CashflowListPage />
      },
      {
        path: "/settings",
        children: [
          {
            index: true,
            element: <SettingPage />
          },
          {
            path: "/settings/product-menu",
            children: [
              {
                index: true,
                element: <ProductMenuPage />
              },
              {
                path: "/settings/product-menu/product-import-export-menu",
                element: <ProductImportExportMenuPage />
              },
              {
                path: "/settings/product-menu/update-price",
                element: <ProductPriceUpdatePage />
              },
              {
                path: "/settings/product-menu/import-products",
                element: <ProductImportScreen />
              },
              {
                path: "/settings/product-menu/export-products",
                element: <ProductExportScreen />
              },
              {
                path: "/settings/product-menu/product-list",
                element: <ItemListPage />
              },
              {
                path: "/settings/product-menu/unit-list",
                element: <UnitListPage />
              },
              {
                path: "/settings/product-menu/category-list",
                element: <CategoryListPage />
              },
              {
                path: "/settings/product-menu/product-setting",
                element: <ProductSettingPage />
              }
            ]
          },
          {
            path: "/settings/supplier",
            element: <SupplierListPage />
          },
          {
            path: "/settings/customer",
            element: <CustomerListPage />
          },
          {
            path: "/settings/cashflow",
            element: <CashflowLandingPage />
          },
          {
            path: "/settings/credit-book",
            children: [
              {
                index: true,
                element: <CreditbookListPage />
              },
              {
                path: "/settings/credit-book/:creditBookId",
                element: <CreditbookDetailPage />
              }
            ]
          },
          {
            path: "/settings/order-menu",
            children: [
              {
                index: true,
                element: <OrderMenuPage />
              },
              {
                path: "/settings/order-menu/order-import-export-menu",
                element: <OrderImportExportMenuPage />
              },
              {
                path: "/settings/order-menu/order-import",
                element: <OrderImportPage />
              },
              // {
              //   path: "/settings/order-menu/order-export",
              //   element: <OrderExportPage />
              // },
              {
                path: "/settings/order-menu/order-setting",
                element: <OrderSettingPage />
              }
            ]
          },
          {
            path: "/settings/manage-accounts",
            element: <AccountManagementPage />
          },
          {
            path: "/settings/about-us",
            element: <AboutUsPage />
          },
          {
            path: "/settings/system-setting",
            children: [
              {
                index: true,
                element: <SystemSettingPage />
              },
              {
                path: "/settings/system-setting/printer-setting",
                element: <PrinterSettingPage />
              },
              {
                path: "/settings/system-setting/theme-setting",
                element: <ThemeSettingPage />
              },
              {
                path: "/settings/system-setting/clear-data",

                children: [
                  {
                    index: true,
                    element: <ClearDataPage />
                  },
                  {
                    path: "/settings/system-setting/clear-data/clear-order-data",
                    element: <ClearOrderDataPage />
                  }
                ]
              }
            ]
          }
        ]
      },

      {
        path: "/profile",
        element: <ProfilePage />
      }
    ]
  },
  {
    path: "/sign-in",
    element: <SignInPage />
  },
  {
    path: "/sign-in-offline",
    element: <OfflineSignInPage />
  },
  {
    path: "/sign-up",
    element: <SignUpPage />
  }
]);

export default router;
