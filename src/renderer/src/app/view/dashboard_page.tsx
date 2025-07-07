import { Button } from "@renderer/assets/shadcn/components/ui/button";

import { Context, useContext, useEffect, useState } from "react";
import { ColorPicker } from "./components/color_picker";
import {
  capitalizeString,
  convertToTitleCase,
  dateRangeBetween,
  formatNumberWithCommas,
  getTodayParsedID,
  parseNumber,
  purifiedNumber,
  savePrimaryColor
} from "@renderer/utils/general_utils";
import { PieChartComponent } from "./components/pie_chart";
import { BarChartComponent } from "./components/bar_chart";
import { LineChartComponent } from "./components/line_chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { ChartContainer, ChartTooltip } from "@renderer/assets/shadcn/components/ui/chart";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import { OrderHistory } from "@renderer/order/interface/order_history";
import { CartesianGrid, Line, LineChart, XAxis, PieChart, Pie, Cell, Label } from "recharts";
import {
  groupOrdersByDate,
  groupOrdersByHour,
  isSingleDayOrders
} from "@renderer/order/utility/order_utils";
import { TooltipProps } from "@radix-ui/react-tooltip";
import LoadingWidget from "./components/loading";
import { Table, TableCell, TableRow } from "@renderer/assets/shadcn/components/ui/table";
import { useRouteContext } from "@renderer/router";
import { encodeGzip } from "@renderer/utils/encrypt_utils";
import { Download, MapPin } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import moment from "moment";
import { AppContext } from "../context/app_context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { Calendar } from "@renderer/assets/shadcn/components/ui/calendar";
import { ConfirmDialog } from "./components/confirm_dialog";
import { Cashflow, encodeCashflowJson, Timeline } from "@renderer/cashflow/interface/cashflow";
import CashflowService from "@renderer/cashflow/service/cashflow_service";
import { encodeCartItemJson } from "@renderer/order/interface/cart_item";
import { Item } from "@renderer/product/interface/item";
import ItemService from "@renderer/product/service/item_service";
import { ValueInputDialog } from "./components/value_input_dialog";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { browserReadFileText, generateDownloadText } from "@renderer/utils/file_utils";
import * as Excel from "xlsx";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";

import { OrderMapView } from "./components/order_map_view";
import { motion } from "framer-motion";
import { exportCashflowExcel } from "@renderer/cashflow/utils/cashflow_excel_utils";
import { exportOrderExcel } from "@renderer/order/utility/order_excel_utils";
import UserService from "@renderer/users/service/account_service";
import { offlineMode } from "@renderer/utils/app_constants";

export default function DashboardPage() {
  const { primaryColor, backgroundColor, isDarkMode } = useContext(AppContext);
  const [showMapView, setShowMapView] = useState(false);

  return (
    <div className={`p-5`}>
      <div className="text-lg flex flex-row justify-between items-center">
        <p>Dashboard</p>
        {!offlineMode && (
          <Button
            variant={"ghost"}
            size={"icon"}
            className={`${showMapView ? "text-primary bg-primary/20" : ""}`}
            onClick={() => setShowMapView(!showMapView)}
          >
            <MapPin />
          </Button>
        )}
      </div>
      <div className="mt-3"></div>
      {showMapView && <OrderMapView date={new Date()} width="100%" height="350px" />}
      <div className="mt-3 flex flex-wrap gap-3 mb-[300px]">
        <OrderDashboard />
        <CashflowDashboard />
        <div className="flex flex-col gap-5">
          <MinimumStockItemDashboard />
          <ExpiredItemDashboard />
        </div>
      </div>
    </div>
  );
}

function ExpiredItemDashboard() {
  const [products, setProducts] = useState<Item[]>([]);
  const [expiredDay, setExpiredDay] = useState(
    () => parseNumber(localStorage.getItem("expiredDay") ?? "") ?? 25
  );
  const [loading, setLoading] = useState(false);

  useEffect(function () {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    setProducts(data);
    setLoading(false);
  };

  const expiredDayFiltered = () => {
    const deadlineItems: Item[] = [];
    products.forEach((product) => {
      const pendingDate = new Date();
      pendingDate.setDate(new Date().getDate() + expiredDay);
      if (product.expiredDate && product.expiredDate.getTime() <= pendingDate.getTime()) {
        deadlineItems.push(product);
      }
    });
    return deadlineItems;
  };

  const { push } = useRouteContext();

  return (
    <Card className="w-[400px] h-[120px]">
      <CardHeader className=" flex flex-row justify-between items-center pb-2 pt-3">
        <CardTitle className="mb-1">Expired Items</CardTitle>

        <ValueInputDialog
          title="Expired Day"
          description="Enter number of days"
          actionTitle="Save"
          onSubmit={(value) => {
            if (value) {
              const quantity = parseNumber(value);
              localStorage.setItem("expiredDay", JSON.stringify(quantity ?? 25));
              setExpiredDay(quantity ?? 25);
            }
          }}
        >
          <Button variant={"ghost"} className="text-primary" size={"sm"}>
            After {expiredDay} days
          </Button>
        </ValueInputDialog>
      </CardHeader>
      <CardFooter className="flex flex-row justify-between pb-3">
        {loading ? <LoadingWidget /> : <div>Total {expiredDayFiltered().length} Items</div>}
        <Button
          size="sm"
          onClick={() => {
            push("/dashboard/expired-items");
          }}
        >
          See More
        </Button>
      </CardFooter>
    </Card>
  );
}

function MinimumStockItemDashboard() {
  const [products, setProducts] = useState<Item[]>([]);
  const [quantity, setQuantity] = useState(
    () => parseNumber(localStorage.getItem("minimumStockQuantity") ?? "") ?? 25
  );
  const [loading, setLoading] = useState(false);

  useEffect(function () {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    setProducts(data);
    setLoading(false);
  };

  const minimumStockFiltered = () => {
    const deadlineItems: Item[] = [];
    products.forEach((product) => {
      if (product.useStock && product.stock < quantity) {
        deadlineItems.push(product);
      }
    });
    return deadlineItems;
  };

  const { push } = useRouteContext();

  return (
    <Card className="w-[400px] h-[120px]">
      <CardHeader className=" flex flex-row justify-between items-center pb-2 pt-3">
        <CardTitle className="mb-1">Minimum Stock</CardTitle>

        <ValueInputDialog
          title="Minimim Stock Qantity"
          description="Enter quantity"
          actionTitle="Save"
          onSubmit={(value) => {
            if (value) {
              const quantity = parseNumber(value);
              localStorage.setItem("minimumStockQuantity", JSON.stringify(quantity ?? 25));
              setQuantity(quantity ?? 25);
            }
          }}
        >
          <Button variant={"ghost"} className="text-primary" size={"sm"}>
            Less {quantity}
          </Button>
        </ValueInputDialog>
      </CardHeader>
      <CardFooter className="flex flex-row justify-between pb-3">
        {loading ? <LoadingWidget /> : <div>Total {minimumStockFiltered().length} Items</div>}
        <Button
          size="sm"
          onClick={() => {
            push("/dashboard/minimum-stock-items");
          }}
        >
          See More
        </Button>
      </CardFooter>
    </Card>
  );
}

function OrderDashboard() {
  // today | last week | last month | last year | single | range
  const [activeMethod, setActiveMethod] = useState<string | null>("today");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [showRangeDatePicker, setShowRangeDatePicker] = useState(false);

  const [pickerStartDate, setPickerStartDate] = useState<Date>(new Date());
  const [pickerEndDate, setPickerEndDate] = useState<Date>(new Date());

  const [orders, setOrders] = useState<OrderHistory[]>([]);

  const { push } = useRouteContext();
  const { currency } = useContext(AppContext);

  const isSingleDay = isSingleDayOrders(orders);
  const orderDataSet = isSingleDay ? groupOrdersByHour(orders) : groupOrdersByDate(orders);

  useEffect(function () {
    fetchData(activeMethod!);
  }, []);

  const fetchData = async (methodName: string) => {
    if (methodName === "today") {
      setLoading(true);
      const data = await OrderHistoryService.getOrderHistories(getTodayParsedID());
      setLoading(false);
      setProgress(0);
      setOrders(data);
      setPickerStartDate(new Date());
      setPickerEndDate(new Date());
    } else if (methodName === "last-week") {
      const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      setLoading(true);
      const records = await OrderHistoryService.getOrderBetween(
        lastWeekDate,
        new Date(),
        (percent) => {
          setProgress(percent * 100);
        }
      );

      setLoading(false);
      setProgress(0);
      setOrders(records);
      setPickerStartDate(lastWeekDate);
      setPickerEndDate(new Date());
    } else if (methodName === "last-month") {
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      setLoading(true);
      const records = await OrderHistoryService.getOrderBetween(
        lastMonthDate,
        new Date(),
        (percent) => {
          setProgress(percent * 100);
        }
      );

      setLoading(false);
      setProgress(0);
      setOrders(records);
      setPickerStartDate(lastMonthDate);
      setPickerEndDate(new Date());
    } else if (methodName === "last-year") {
      const lastYearDate = new Date();
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);

      setLoading(true);
      const records = await OrderHistoryService.getOrderBetween(
        lastYearDate,
        new Date(),
        (percent) => {
          setProgress(percent * 100);
        }
      );

      setLoading(false);
      setProgress(0);
      setOrders(records);
      setPickerStartDate(lastYearDate);
      setPickerEndDate(new Date());
    } else if (methodName === "single") {
      setShowSingleDatePicker(true);
    } else if (methodName === "range") {
      setShowRangeDatePicker(true);
    }
  };

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

    const isActiveDot = payload.name === activeMethod;
    const dotColor = isActiveDot ? "#ffbf00" : localStorage.getItem("appPrimaryColor");
    if (!isActiveDot) return null;

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
    <Card className={`w-[400px]`}>
      <CardHeader className="flex flex-row justify-between items-start pb-0">
        <div>
          <CardTitle className="mb-1">Orders</CardTitle>
          <CardDescription>{`${moment(pickerStartDate).format("MMM DD y")} - ${moment(pickerEndDate).format("MMM DD y")}`}</CardDescription>
        </div>
        <Select
          value={activeMethod}
          onValueChange={(value) => {
            setActiveMethod(value);
            fetchData(value);
          }}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue>{activeMethod ? convertToTitleCase(activeMethod) : "Select"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["today", "last-week", "last-month", "last-year", "single", "range"].map(
              (name, index) => {
                return (
                  <SelectItem key={index} value={name}>
                    {convertToTitleCase(name)}
                  </SelectItem>
                );
              }
            )}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="relative pb-0 mt-0 p-3">
        <div
          className={`absolute bg-background rounded-lg z-50 right-5 p-2 border ${showSingleDatePicker ? "block" : "hidden"}`}
        >
          <Calendar
            mode="single"
            selected={pickerEndDate}
            onSelect={(date) => {
              setPickerStartDate(date ?? new Date());
              setPickerEndDate(date ?? new Date());
            }}
          ></Calendar>
          <Button
            className="w-full"
            onClick={async () => {
              setShowSingleDatePicker(false);
              setLoading(true);
              const data = await OrderHistoryService.getOrderHistories(
                getTodayParsedID(pickerEndDate)
              );
              setLoading(false);
              setProgress(0);
              setOrders(data);
              setActiveMethod(null);
            }}
          >
            Select
          </Button>
          <Button
            className="w-full mt-2"
            variant="outline"
            onClick={async () => {
              setShowSingleDatePicker(false);
              setActiveMethod(null);
            }}
          >
            Close
          </Button>
        </div>
        <div
          className={`absolute bg-background rounded-lg z-50 -right-[100px] p-2 border ${showRangeDatePicker ? "block" : "hidden"}`}
        >
          <Calendar
            mode="range"
            fromDate={new Date(1970, 0, 1)}
            // defaultMonth={pickerStartDate}
            selected={{ from: pickerStartDate, to: pickerEndDate }}
            numberOfMonths={2}
            onSelect={(dateRange) => {
              setPickerStartDate(dateRange.from ?? new Date());
              setPickerEndDate(dateRange.to ?? new Date());
            }}
          ></Calendar>
          <Button
            className="w-1/3 block ml-auto"
            onClick={async () => {
              setShowRangeDatePicker(false);
              setLoading(true);

              const records = await OrderHistoryService.getOrderBetween(
                pickerStartDate,
                pickerEndDate,
                (percent) => {
                  setProgress(percent * 100);
                }
              );
              setLoading(false);
              setProgress(0);
              setOrders(records);
              setActiveMethod(null);
            }}
          >
            Select
          </Button>
          <Button
            className="w-1/3 block ml-auto mt-2"
            variant="outline"
            onClick={() => {
              setShowRangeDatePicker(false);
              setActiveMethod(null);
            }}
          >
            Close
          </Button>
        </div>
        {loading && (
          <div className="w-full h-[200px] flex flex-col justify-center items-center">
            {activeMethod === "single" || activeMethod === "today" ? (
              <LoadingWidget />
            ) : (
              <CircularProgressbar
                value={progress}
                text={`${Math.round(purifiedNumber(progress))}%`}
                className="size-12"
                styles={buildStyles({
                  rotation: 0.25,
                  strokeLinecap: "butt",
                  textSize: "1.3rem",
                  pathTransitionDuration: 0.5,
                  pathColor: primaryColor,
                  textColor: "grey",
                  trailColor: "#d6d6d6",
                  backgroundColor: "#3e98c7"
                })}
              />
            )}
          </div>
        )}

        {/* {!loading && orders.length === 0 && (
          <div className="w-full h-[200px] flex justify-center items-center">
            <p className="text-slate-500 text-sm">No Orders</p>
          </div>
        )} */}
        {!loading && (
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
        )}
      </CardContent>
      {!loading && (
        <CardFooter className="flex flex-col text-sm p-3 pt-0">
          <Table>
            <TableRow className="border-b-0">
              <TableCell>Total Orders</TableCell>
              <TableCell className="text-end">{orders.length}</TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Total Amount</TableCell>
              <TableCell className="text-end">
                {formatNumberWithCommas(
                  orders.length === 0
                    ? 0
                    : orders.map((e) => e.calculateTotal()).reduce((a, b) => a + b)
                )}{" "}
                {currency}
              </TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Profit</TableCell>
              <TableCell className="text-end">
                {formatNumberWithCommas(
                  orders.length === 0
                    ? 0
                    : orders.map((e) => e.getProfitOrLoss()).reduce((a, b) => a + b)
                )}{" "}
                {currency}
              </TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Credit Amount</TableCell>
              <TableCell className="text-end">
                {formatNumberWithCommas(
                  orders.length === 0
                    ? 0
                    : purifiedNumber(
                        orders.map((e) => e.calculateTotal() - e.payAmount).reduce((a, b) => a + b)
                      )
                )}{" "}
                {currency}
              </TableCell>
            </TableRow>
          </Table>
          <div className="w-full mt-3 flex flex-row justify-between">
            {exporting ? (
              <LoadingWidget />
            ) : (
              <Button
                variant={"ghost"}
                size={"sm"}
                className="text-green-700"
                onClick={async () => {
                  setExporting(true);
                  const users = await UserService.getUsers();
                  await exportOrderExcel(
                    `Order Export ${new Date().getMilliseconds()}.xlsx`,
                    orders,
                    users,
                    "customSave"
                  );
                  setExporting(false);
                }}
              >
                Export Excel <Download className="size-4 ml-2" />
              </Button>
            )}
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => {
                push("/order-list", {
                  title: `${moment(pickerStartDate).format("MMM DD y")} - ${moment(pickerEndDate).format("MMM DD y")}`,
                  data: encodeGzip(JSON.stringify(orders.map((e) => e.toJson())))
                });
              }}
            >
              See Orders
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export const getTimelinesBetween = async (
  from: Date,
  to: Date,
  onProgress?: (progress: number) => void
) => {
  const dataStore: Cashflow[] = [];

  const dates = dateRangeBetween(from, to);
  let finishedCount = 0;

  for (let intervalDate of dates) {
    const cashbook = await CashflowService.getCashflow(getTodayParsedID(intervalDate));

    if (cashbook) {
      dataStore.push(cashbook);
    }
    finishedCount++;
    onProgress?.(finishedCount / dates.length);
  }
  return dataStore;
};

function CashflowDashboard() {
  // today | last week | last month | last year | single | range
  const [activeMethod, setActiveMethod] = useState<string | null>("today");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [showRangeDatePicker, setShowRangeDatePicker] = useState(false);

  const [pickerStartDate, setPickerStartDate] = useState<Date>(new Date());
  const [pickerEndDate, setPickerEndDate] = useState<Date>(new Date());

  const [cashbooks, setCashbooks] = useState<Cashflow[]>([]);

  const { push } = useRouteContext();
  const { currency } = useContext(AppContext);

  useEffect(function () {
    fetchData(activeMethod!);
  }, []);

  const groupTimelinesByName = (books: Cashflow[]) => {
    const data: { id: string; name: string; quantity: number }[] = [];
    for (let j = 0; j < books.length; j++) {
      const book = books[j];
      for (let timeline of book.records) {
        const matched =
          data.length > 0 ? data.find((e) => e.id === `${timeline.timelineId}`) : undefined;
        if (matched) {
          matched.name = timeline.name;
          matched.quantity += timeline.amount;
        } else {
          data.push({
            id: timeline.timelineId,
            name: `${timeline.name}`,
            quantity: timeline.amount
          });
        }
      }
    }

    return data.map((e) => {
      return { name: e.name, quantity: e.quantity };
    });
  };

  const orderDataSet = groupTimelinesByName(cashbooks);

  function incomeCalculate(cashbooks: Cashflow[]): number {
    let allTimelines: Timeline[] = [];

    cashbooks.forEach((element) => {
      allTimelines = allTimelines.concat(element.records);
    });

    if (allTimelines.length === 0) return 0;

    const incomeTimelines = allTimelines.filter((e) => e.amount !== null && e.amount > 0);

    if (incomeTimelines.length === 0) return 0;

    return incomeTimelines.map((e) => e.amount!).reduce((value, element) => value + element);
  }

  function outcomeCalculate(cashbooks: Cashflow[]): number {
    let allTimelines: Timeline[] = [];

    cashbooks.forEach((element) => {
      allTimelines = allTimelines.concat(element.records);
    });

    if (allTimelines.length === 0) return 0;

    const outcomeTimelines = allTimelines.filter((e) => e.amount !== null && e.amount < 0);

    if (outcomeTimelines.length === 0) return 0;

    return outcomeTimelines.map((e) => e.amount!).reduce((value, element) => value + element);
  }

  const fetchData = async (methodName: string) => {
    if (methodName === "today") {
      setLoading(true);
      const data = await getTimelinesBetween(new Date(), new Date());
      setLoading(false);
      setProgress(0);
      setCashbooks(data);
      setPickerStartDate(new Date());
      setPickerEndDate(new Date());
    } else if (methodName === "last-week") {
      const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      setLoading(true);
      const records = await getTimelinesBetween(lastWeekDate, new Date(), (percent) => {
        setProgress(percent * 100);
      });

      setLoading(false);
      setProgress(0);
      setCashbooks(records);
      setPickerStartDate(lastWeekDate);
      setPickerEndDate(new Date());
    } else if (methodName === "last-month") {
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      setLoading(true);
      const records = await getTimelinesBetween(lastMonthDate, new Date(), (percent) => {
        setProgress(percent * 100);
      });

      setLoading(false);
      setProgress(0);
      setCashbooks(records);
      setPickerStartDate(lastMonthDate);
      setPickerEndDate(new Date());
    } else if (methodName === "last-year") {
      const lastYearDate = new Date();
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);

      setLoading(true);
      const records = await getTimelinesBetween(lastYearDate, new Date(), (percent) => {
        setProgress(percent * 100);
      });

      setLoading(false);
      setProgress(0);
      setCashbooks(records);
      setPickerStartDate(lastYearDate);
      setPickerEndDate(new Date());
    } else if (methodName === "single") {
      setShowSingleDatePicker(true);
    } else if (methodName === "range") {
      setShowRangeDatePicker(true);
    }
  };

  const { primaryColor } = useContext(AppContext);
  const colorizedItems = orderDataSet.map((e) => {
    return { ...e, fill: primaryColor };
  });

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-lg">
          <p className="label">{`${label} - ${payload[0].value} ${currency}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: DotProps) => {
    const { cx, cy, value, isActive, stroke, strokeWidth, payload, onClick } = props;

    const isActiveDot = payload.name === activeMethod;
    const dotColor = isActiveDot ? "#ffbf00" : localStorage.getItem("appPrimaryColor");
    if (!isActiveDot) return null;

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
    <Card className={`w-[400px] `}>
      <CardHeader className="flex flex-row justify-between items-start pb-0">
        <div>
          <CardTitle className="mb-1">Daily Cash</CardTitle>
          <CardDescription>{`${moment(pickerStartDate).format("MMM DD y")} - ${moment(pickerEndDate).format("MMM DD y")}`}</CardDescription>
        </div>
        <Select
          value={activeMethod}
          onValueChange={(value) => {
            setActiveMethod(value);
            fetchData(value);
          }}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue>{activeMethod ? convertToTitleCase(activeMethod) : "Select"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["today", "last-week", "last-month", "last-year", "single", "range"].map(
              (name, index) => {
                return (
                  <SelectItem key={index} value={name}>
                    {convertToTitleCase(name)}
                  </SelectItem>
                );
              }
            )}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="relative pb-0 mt-0 p-3">
        <div
          className={`absolute bg-background rounded-lg z-50 right-5 p-2 border ${showSingleDatePicker ? "block" : "hidden"}`}
        >
          <Calendar
            mode="single"
            selected={pickerEndDate}
            onSelect={(date) => {
              setPickerStartDate(date ?? new Date());
              setPickerEndDate(date ?? new Date());
            }}
          ></Calendar>
          <Button
            className="w-full"
            onClick={async () => {
              setShowSingleDatePicker(false);
              setLoading(true);
              const data = await getTimelinesBetween(pickerStartDate, pickerEndDate);
              setLoading(false);
              setProgress(0);
              setCashbooks(data);
              setActiveMethod(null);
            }}
          >
            Select
          </Button>
          <Button
            className="w-full mt-2"
            variant="outline"
            onClick={async () => {
              setShowSingleDatePicker(false);
              setActiveMethod(null);
            }}
          >
            Close
          </Button>
        </div>
        <div
          className={`absolute bg-background rounded-lg z-50 -right-[100px] p-2 border ${showRangeDatePicker ? "block" : "hidden"}`}
        >
          <Calendar
            mode="range"
            fromDate={new Date(1970, 0, 1)}
            // defaultMonth={pickerStartDate}
            selected={{ from: pickerStartDate, to: pickerEndDate }}
            numberOfMonths={2}
            onSelect={(dateRange) => {
              setPickerStartDate(dateRange.from ?? new Date());
              setPickerEndDate(dateRange.to ?? new Date());
            }}
          ></Calendar>
          <Button
            className="w-1/3 block ml-auto"
            onClick={async () => {
              setShowRangeDatePicker(false);
              setLoading(true);
              const records = await getTimelinesBetween(
                pickerStartDate,
                pickerEndDate,
                (percent) => {
                  setProgress(percent * 100);
                }
              );
              setLoading(false);
              setProgress(0);
              setCashbooks(records);
              setActiveMethod(null);
            }}
          >
            Select
          </Button>
          <Button
            className="w-1/3 block ml-auto mt-2"
            variant="outline"
            onClick={() => {
              setShowRangeDatePicker(false);
              setActiveMethod(null);
            }}
          >
            Close
          </Button>
        </div>
        {loading && (
          <div className="w-full h-[200px] flex flex-col justify-center items-center">
            {activeMethod === "single" || activeMethod === "today" ? (
              <LoadingWidget />
            ) : (
              <CircularProgressbar
                value={progress}
                text={`${Math.round(purifiedNumber(progress))}%`}
                className="size-12"
                styles={buildStyles({
                  rotation: 0.25,
                  strokeLinecap: "butt",
                  textSize: "1.3rem",
                  pathTransitionDuration: 0.5,
                  pathColor: primaryColor,
                  textColor: "grey",
                  trailColor: "#d6d6d6",
                  backgroundColor: "#3e98c7"
                })}
              />
            )}
          </div>
        )}

        {/* {!loading && cashbooks.length === 0 && (
          <div className="w-full h-[200px] flex justify-center items-center">
            <p className="text-slate-500 text-sm">No Records</p>
          </div>
        )} */}
        {!loading && (
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
        )}
      </CardContent>
      {!loading && (
        <CardFooter className="flex flex-col text-sm p-3 pt-0">
          <Table>
            <TableRow className="border-b-0">
              <TableCell>Total Records</TableCell>
              <TableCell className="text-end">
                {cashbooks.length === 0
                  ? 0
                  : cashbooks.map((e) => e.records.length).reduce((a, b) => a + b)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Income</TableCell>
              <TableCell className="text-end">
                {incomeCalculate(cashbooks)} {currency}
              </TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Outcome</TableCell>
              <TableCell className="text-end">
                {formatNumberWithCommas(outcomeCalculate(cashbooks))} {currency}
              </TableCell>
            </TableRow>
            <TableRow className="border-b-0">
              <TableCell>Net</TableCell>
              <TableCell className="text-end">
                {formatNumberWithCommas(outcomeCalculate(cashbooks) + incomeCalculate(cashbooks))}{" "}
                {currency}
              </TableCell>
            </TableRow>
          </Table>
          <div className="w-full mt-3 flex flex-row justify-between">
            {exporting ? (
              <LoadingWidget />
            ) : (
              <Button
                variant={"ghost"}
                size={"sm"}
                className="text-green-700"
                onClick={async () => {
                  setExporting(true);
                  await exportCashflowExcel(
                    `Cash Flow Export ${new Date().getMilliseconds()}.xlsx`,
                    cashbooks.map((e) => e.records).flat(),
                    "customSave"
                  );
                  setExporting(false);
                }}
              >
                Export Excel <Download className="size-4 ml-2" />
              </Button>
            )}
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => {
                push("/cashflow-list", {
                  title: `${moment(pickerStartDate).format("MMM DD y")} - ${moment(pickerEndDate).format("MMM DD y")}`,
                  data: encodeGzip(JSON.stringify(cashbooks.map((e) => encodeCashflowJson(e)))),
                  breadcumbRoutes: JSON.stringify([{ name: "Dashboard", route: "/dashboard" }])
                });
              }}
            >
              See Records
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
