import { firebaseFirestore } from "@renderer/firebase";
import BreadcrumbContext from "./components/breadcrumb_context";
import { useState } from "react";
import { LayoutGrid } from "lucide-react";

import LoadingWidget from "./components/loading";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { OrderHistory } from "@renderer/order/interface/order_history";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import { getTodayParsedID } from "@renderer/utils/general_utils";
import moment from "moment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { Calendar } from "@renderer/assets/shadcn/components/ui/calendar";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";

export function ClearOrderDataPage() {
  const [removing, setRemoving] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const clearOrder = async (startDate: Date, endDate: Date) => {
    setRemoving(true);
    const data = await OrderHistoryService.getOrderBetween(startDate, endDate, (progress) =>
      setPrompt(`Getting Order ${Math.round(progress * 100)}%`)
    );
    let finishedCount = 0;
    for (const order of data) {
      await OrderHistoryService.deleteOrderHistory(getTodayParsedID(order.date), order.orderId);
      finishedCount++;
      setPrompt(
        `Deleteing ${moment(order.date).format("MMM DD y")} ${order.customer} (${Math.round((finishedCount / data.length) * 100)} %)`
      );
    }
    setRemoving(false);
    setPrompt(`Deleted ${finishedCount} Order(s)`);
    toast({ title: "Successfully Cleared Selected Date Order" });
  };

  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "System Setting", route: "/settings/system-setting" },
          { name: "Clear Data", route: "/settings/system-setting/clear-data" },
          {
            name: "Clear Order Data",
            route: "/settings/system-setting/clear-data/clear-order-data"
          }
        ]}
      />
      <p className="text-lg">{title ?? "Clear Order Data"}</p>
      <div className="mt-3 w-[400px]">
        <div className="flex flex-row justify-between items-center">
          <p className="text-sm">Start Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"ghost"} size={"sm"} className="ml-3 text-primary font-bold">
                {startDate ? moment(startDate).format("MMM DD y") : "Choose Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date ?? new Date());
                }}
              ></Calendar>
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-1 flex flex-row justify-between items-center">
          <p className="text-sm">End Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"ghost"} size={"sm"} className="ml-3 text-primary font-bold">
                {endDate ? moment(endDate).format("MMM DD y") : "Choose Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date ?? new Date());
                }}
              ></Calendar>
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-1 h-10 flex flex-row justify-between items-center">
          <p className="text-sm text-slate-500">{prompt}</p>
          {removing && <LoadingWidget height={40} width={40} />}
        </div>

        <Button
          className="ml-auto block mt-5"
          variant={removing ? "outline" : "default"}
          onClick={async () => {
            if (removing) return;
            if (!startDate) {
              toast({ title: "Select Start Dart" });
              return;
            }
            if (!endDate) {
              toast({ title: "Select End Dart" });
              return;
            }
            if (endDate.getTime() < startDate.getTime()) {
              toast({ title: "End Date cannot earlier than Start Date" });
              return;
            }
            await clearOrder(startDate, endDate);
          }}
        >
          Clear Data
        </Button>
      </div>
    </div>
  );
}
