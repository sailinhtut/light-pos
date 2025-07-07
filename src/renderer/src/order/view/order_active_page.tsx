import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@renderer/assets/shadcn/components/ui/hover-card";
import { useRouteContext } from "@renderer/router";
import { durationGenerator, formatNumberWithCommas } from "@renderer/utils/general_utils";
import {
  ChevronRight,
  CircleDollarSign,
  Coffee,
  GanttChart,
  HandPlatter,
  History,
  WifiOff
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { OrderHistory } from "../interface/order_history";
import OrderActiveService from "../service/order_active_service";
import { formatOrderTime } from "../utility/order_utils";
import LoadingWidget from "@renderer/app/view/components/loading";
import { navBarHeight, sideMenuBarWidth } from "@renderer/utils/app_configs";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@renderer/assets/shadcn/components/ui/tabs";
import OrderActiveLocalService from "../service/order_active_local_service";
import { offlineMode } from "@renderer/utils/app_constants";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";

export default function OrderActivePage() {
  const { push } = useRouteContext();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const [isOnlineActiveOrder, setOnlineActiveOrder] = useState(
    offlineMode ? true : localStorage.getItem("orderActivePageOnline") === "true"
  );
  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

  useEffect(
    function () {
      fetchOrders();
    },
    [isOnlineActiveOrder]
  );

  const fetchOrders = async () => {
    setLoading(true);
    let data = isOnlineActiveOrder
      ? await OrderActiveService.getOrderHistories()
      : await new OrderActiveLocalService().getOrderHistories();
    if (isCasher) {
      data = data.filter((e) => e.casherId === currentUser.docId);
    }
    setOrders(data);
    setLoading(false);
  };

  const totalAmount = () => {
    if (orders && orders.length > 0) {
      return orders.map((e) => e.getAmount()).reduce((a, b) => a + b);
    }
    return 0;
  };

  const totalItems = () => {
    if (orders && orders.length > 0) {
      return orders.map((e) => e.orders.length).reduce((a, b) => a + b);
    }
    return 0;
  };

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Active Orders", route: "/order-active" }
        ]}
      />
      <Tabs
        defaultValue={isOnlineActiveOrder ? "online-active-orders" : "offline-active-orders"}
        onValueChange={(value) => {
          setOnlineActiveOrder(value === "online-active-orders");
          localStorage.setItem(
            "orderActivePageOnline",
            value === "online-active-orders" ? "true" : "false"
          );
        }}
      >
        <div className="flex justify-between items-center ">
          <p className="text-lg">{isOnlineActiveOrder ? "Active Orders" : "Offline Orders"}</p>
          <div className="flex items-center space-x-3">
            <Button
              variant={"outline"}
              onClick={() => {
                if (isOnlineActiveOrder) {
                  push("/order-history");
                } else {
                  push("/order-history-offline");
                }
              }}
            >
              {isOnlineActiveOrder ? (
                <History className="mr-2 size-5 text-primary" />
              ) : (
                <WifiOff className="mr-2 size-5 text-primary" />
              )}{" "}
              {isOnlineActiveOrder ? "Order History" : "Order History Offline"}{" "}
            </Button>
            {!offlineMode && (
              <TabsList className="w-[230px] h-[37px] grid grid-cols-2">
                <TabsTrigger value="online-active-orders">Online Orders</TabsTrigger>
                <TabsTrigger value="offline-active-orders">Offline Orders</TabsTrigger>
              </TabsList>
            )}
          </div>
        </div>

        <TabsContent value="online-active-orders">
          <div className="mt-3 border rounded-xl shadow  flex p-3 px-10 gap-x-10 max-w-fit">
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Order{" "}
                <HandPlatter className="size-5 text-zinc-500 group-hover:text-blue-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{orders.length}</p>
            </div>
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Item{" "}
                <Coffee className="size-5 text-zinc-500 group-hover:text-green-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{formatNumberWithCommas(totalItems())}</p>
            </div>
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Amount{" "}
                <CircleDollarSign className="size-5 text-zinc-500 group-hover:text-amber-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{formatNumberWithCommas(totalAmount())}</p>
            </div>
          </div>
          {loading && <LoadingWidget />}
          {!loading && (
            <div className="flex flex-wrap py-5">
              {orders.map((order, index) => (
                <OrderCard
                  key={index}
                  order={order}
                  index={index + 1}
                  isOnlineOrder={isOnlineActiveOrder}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="offline-active-orders">
          <div className="mt-3 border rounded-xl shadow  flex p-3 px-10 gap-x-10 max-w-fit">
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Order{" "}
                <HandPlatter className="size-5 text-zinc-500 group-hover:text-blue-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{orders.length}</p>
            </div>
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Item{" "}
                <Coffee className="size-5 text-zinc-500 group-hover:text-green-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{formatNumberWithCommas(totalItems())}</p>
            </div>
            <div className="flex flex-col items-start group cursor-default">
              <p className="font-medium flex gap-x-1 items-center">
                Amount{" "}
                <CircleDollarSign className="size-5 text-zinc-500 group-hover:text-amber-500 transition-all duration-300 group-hover:-translate-y-1" />
              </p>
              <p>{formatNumberWithCommas(totalAmount())}</p>
            </div>
          </div>
          {loading && <LoadingWidget />}
          {!loading && (
            <div className="flex flex-wrap py-5">
              {orders.map((order, index) => (
                <OrderCard
                  key={index}
                  order={order}
                  index={index + 1}
                  isOnlineOrder={isOnlineActiveOrder}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({
  order,
  index,
  isOnlineOrder
}: {
  order: OrderHistory;
  index: number;
  isOnlineOrder: boolean;
}) {
  const { push } = useRouteContext();
  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <Card
          className="w-[300px] group cursor-default mr-3 my-2 shadow transition-all duration-300 dark:hover:border-primary active:scale-95"
          onClick={() => {
            if (isOnlineOrder) {
              push(`/order-active/${order.orderId}`);
            } else {
              push(`/order-active-offline/${order.orderId}`);
            }
          }}
        >
          <CardHeader className="px-5 py-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {index}. {order.customer}
                </CardTitle>
                <CardDescription className="mt-1 transition-all duration-200 ">
                  {formatOrderTime(order.date)}
                  <br></br>Amount - {formatNumberWithCommas(order.getAmount())} Kyats •{" "}
                  {order.orders.length} Items
                </CardDescription>
              </div>

              <Button
                variant={"ghost"}
                className="rounded-full px-0 size-10 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300 delay-300"
                size={"icon"}
              >
                <ChevronRight className="text-primary" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={8}
        align="end"
        className="rounded-3xl bg-gray-900 text-slate-100 text-sm font-normal"
      >
        <table>
          <tr className="hover:text-white cursor-default">
            <td>Item</td>
            <td className="pl-5 ">{order.orders.length} items</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td>Amount</td>
            <td className="pl-5 ">{formatNumberWithCommas(order.amount)} Ks</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td>Discount</td>
            <td className="pl-5 ">{formatNumberWithCommas(order.discount)} Ks</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td>Tax</td>
            <td className="pl-5 ">{formatNumberWithCommas(order.tag)} Ks</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td>Total</td>
            <td className="pl-5 ">{formatNumberWithCommas(order.total)} Ks</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td>Casher</td>
            <td className="pl-5 ">{order.casherName}</td>
          </tr>
          <tr className="hover:text-white cursor-default">
            <td className="align-top">Duration</td>
            <td className="pl-5  h-100">{durationGenerator(order.date)}</td>
          </tr>
        </table>
      </HoverCardContent>
    </HoverCard>
  );
}
