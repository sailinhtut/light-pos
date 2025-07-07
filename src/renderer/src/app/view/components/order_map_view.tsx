import React, { useContext, useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { OrderHistory } from "@renderer/order/interface/order_history";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import {
  formatNumberWithCommas,
  getTodayParsedID,
  purifiedNumber
} from "@renderer/utils/general_utils";
import User from "@renderer/auth/interface/user";
import UserService from "@renderer/users/service/account_service";
import { CartesianGrid, DotProps, Line, LineChart, TooltipProps, XAxis } from "recharts";
import { AppContext } from "@renderer/app/context/app_context";
import {
  groupOrdersByDate,
  groupOrdersByHour,
  isSingleDayOrders
} from "@renderer/order/utility/order_utils";
import { useRouteContext } from "@renderer/router";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import { Table, TableCell, TableRow } from "@renderer/assets/shadcn/components/ui/table";
import { ChartContainer, ChartTooltip } from "@renderer/assets/shadcn/components/ui/chart";
import moment from "moment";
import { Card, CardContent } from "@renderer/assets/shadcn/components/ui/card";
import LoadingWidget from "./loading";

export function OrderMapView({
  width = "100%",
  height = "400px",
  date = new Date()
}: {
  date: Date;
  width?: string;
  height?: string;
}) {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const { push } = useRouteContext();
  const { currency } = useContext(AppContext);

  useEffect(function () {
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await OrderHistoryService.getOrderHistories(getTodayParsedID(date));
    setOrders(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const data = await UserService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const locationValidatedUsers = users.filter((e) => {
    return e.location && e.location !== null && e.location.latitude && e.location.longitude;
  });
  const userSpecificOrders = orders.filter((e) => e.casherId === activeUserId);
  const isSingleDay = isSingleDayOrders(userSpecificOrders);
  const orderDataSet = isSingleDay
    ? groupOrdersByHour(userSpecificOrders)
    : groupOrdersByDate(userSpecificOrders);

  const { primaryColor } = useContext(AppContext);
  const colorizedItems = orderDataSet.map((e) => {
    return { ...e, fill: primaryColor };
  });

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-lg">
          <p className="label">{`${label} - ${payload[0].value} Orders`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: DotProps) => {
    const { cx, cy, value, isActive, stroke, strokeWidth, payload, onClick } = props;

    const dotColor = isActive ? "#ffbf00" : localStorage.getItem("appPrimaryColor");

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={dotColor}
        strokeWidth={strokeWidth}
        style={{ cursor: "pointer" }}
      >
        <text>Hello</text>
      </circle>
    );
  };

  return (
    <LoadScript
      googleMapsApiKey=""
      loadingElement={
        <div
          className={` border shadow flex flex-col justify-center items-center rounded-2xl`}
          style={{ width: width, height: height }}
        >
          <LoadingWidget />
          <p className="text-slate-500 text-sm">Loading Map</p>
        </div>
      }
    >
      <GoogleMap
        mapContainerStyle={{
          width: width,
          height: height,
          margin: 0,
          borderRadius: "13px", // Rounded corners for the map container
          // boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(0,0,0,0.2)"
        }}
        center={
          locationValidatedUsers.length > 0
            ? {
                lat: locationValidatedUsers[0].location!.latitude,
                lng: locationValidatedUsers[0].location!.longitude
              }
            : {
                lat: 21.9162,
                lng: 95.956
              }
        }
        zoom={9}
      >
        {locationValidatedUsers.map((user) => (
          <Marker
            key={user.docId}
            position={{ lat: user.location!.latitude, lng: user.location!.longitude }}
            onClick={() => {
              if (user.docId === activeUserId) {
                return;
              }
              setActiveUserId(user.docId);
            }}
          >
            {activeUserId === user.docId && (
              <InfoWindow
                position={{ lat: user.location!.latitude, lng: user.location!.longitude }}
                onCloseClick={() => setActiveUserId(null)}
                options={{}}
              >
                <div>
                  <p className="text-lg font-semibold">{user.name}</p>
                  <p className="text-slate-500 mt-2">
                    Updated On -{moment(user.updatedAt).format("HH:mm A MMM DD y")}
                  </p>
                  <p className="text-slate-500 mt-1">
                    Total Order - {orders.filter((e) => e.casherId === user.docId).length}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant={"outline"} size={"sm"} className="mt-3 ml-auto block">
                        See Order Detail
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{user.name}'s Order</DialogTitle>
                      </DialogHeader>
                      <ChartContainer config={{}}>
                        <LineChart
                          accessibilityLayer
                          data={colorizedItems}
                          margin={{
                            left: 12,
                            right: 12,
                            top: 20,
                            bottom: 0
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                          />
                          <ChartTooltip cursor={false} content={<CustomTooltip />} />
                          <Line
                            dataKey="quantity"
                            type="natural"
                            stroke={localStorage.getItem("appPrimaryColor")}
                            strokeWidth={2}
                            dot={<CustomDot />}
                          />
                        </LineChart>
                      </ChartContainer>
                      <Table>
                        <TableRow className="border-b-0">
                          <TableCell>Total Orders</TableCell>
                          <TableCell className="text-end">{userSpecificOrders.length}</TableCell>
                        </TableRow>
                        <TableRow className="border-b-0">
                          <TableCell>Total Amount</TableCell>
                          <TableCell className="text-end">
                            {formatNumberWithCommas(
                              userSpecificOrders.length === 0
                                ? 0
                                : userSpecificOrders
                                    .map((e) => e.calculateTotal())
                                    .reduce((a, b) => a + b)
                            )}{" "}
                            {currency}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-b-0">
                          <TableCell>Profit</TableCell>
                          <TableCell className="text-end">
                            {formatNumberWithCommas(
                              userSpecificOrders.length === 0
                                ? 0
                                : userSpecificOrders
                                    .map((e) => e.getProfitOrLoss())
                                    .reduce((a, b) => a + b)
                            )}{" "}
                            {currency}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-b-0">
                          <TableCell>Credit Amount</TableCell>
                          <TableCell className="text-end">
                            {formatNumberWithCommas(
                              userSpecificOrders.length === 0
                                ? 0
                                : purifiedNumber(
                                    userSpecificOrders
                                      .map((e) => e.calculateTotal() - e.payAmount)
                                      .reduce((a, b) => a + b)
                                  )
                            )}{" "}
                            {currency}
                          </TableCell>
                        </TableRow>
                      </Table>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant={"outline"} size={"sm"}>
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
