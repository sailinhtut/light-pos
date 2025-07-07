import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useContext, useEffect, useState } from "react";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  DollarSign,
  MoreHorizontal,
  RefreshCcw,
  Settings2,
  Trash,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import {
  chunkArray,
  formatNumberWithCommas,
  getTodayParsedID,
  paginator,
  uniqueId
} from "@renderer/utils/general_utils";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@renderer/assets/shadcn/components/ui/dialog";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import CashflowService from "../service/cashflow_service";
import { Cashflow, decodeCashflowJson, Timeline } from "../interface/cashflow";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { useSearchParams } from "react-router-dom";
import { decodeGzip } from "@renderer/utils/encrypt_utils";
import { useRouteContext } from "@renderer/router";
import { CashDetailDialog, TimelineDeleteDialog, TimelineDialog } from "./cashflow_landing_screen";
import { AppContext } from "@renderer/app/context/app_context";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import moment from "moment";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";

export default function CashflowListPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [title, setTitle] = useState("Orders");
  const [records, setRecords] = useState<Timeline[]>([]);

  const { push } = useRouteContext();
  const { currency } = useContext(AppContext);

  useEffect(function () {
    const json = decodeGzip(searchParams.get("data") ?? "");
    const data = (JSON.parse((json ?? "[]").length === 0 ? "[]" : json) as []).map((e) =>
      decodeCashflowJson(e)
    );
    setRecords(data.map((e) => e.records).flat());

    const titleValue = searchParams.get("title");
    setTitle(titleValue ?? title);
  }, []);

  const filterCashflows = (origin: Timeline[]) => {
    let filtered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.timelineId.includes(query)
    );
    if (sortLastest) {
      filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else {
      filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return filtered;
  };

  function incomeCalculate(timelines: Timeline[]): number {
    if (timelines.length === 0) return 0;

    const incomeTimelines = timelines.filter((e) => e.amount !== null && e.amount > 0);

    if (incomeTimelines.length === 0) return 0;

    return incomeTimelines.map((e) => e.amount!).reduce((value, element) => value + element);
  }

  function outcomeCalculate(timelines: Timeline[]): number {
    if (timelines.length === 0) return 0;

    const outcomeTimelines = timelines.filter((e) => e.amount !== null && e.amount < 0);

    if (outcomeTimelines.length === 0) return 0;

    return outcomeTimelines.map((e) => e.amount!).reduce((value, element) => value + element);
  }

  const [sortLastest, setSortLastest] = useState(true);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const filteredRecords = filterCashflows(records);
  const paginatedData = paginator(filteredRecords, paginateIndex, 10);

  const [searchParams] = useSearchParams();
  const breadcumRoutes = JSON.parse(searchParams.get("breadcumbRoutes") ?? "[]");

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          ...breadcumRoutes,
          { name: "Cashflow List", route: "/cashflow-list" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">{title}</p>
        <div className="flex">
          <Button variant={"ghost"} className="w-[40px] px-2 ">
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            className="mx-3"
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant={"outline"} size={"icon"}>
                <Settings2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setSortLastest(!sortLastest)}>
                  {sortLastest ? "Sort Earliest" : "Sort Lastest"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.div
            initial={{
              x: "-100%",
              opacity: 1,
              width: 0
            }}
            animate={{
              x: selectedIDs.length > 0 ? 0 : "100%",
              opacity: selectedIDs.length > 0 ? 1 : 0,
              width: selectedIDs.length > 0 ? "auto" : 0
            }}
          >
            <ConfirmDialog
              actionVariant={"destructive"}
              title="Delete Cash"
              description="Are you sure to delete all selected cash ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const recordId of selectedIDs) {
                  const selectedRecord = records.find((e) => e.timelineId === recordId);
                  if (selectedRecord) {
                    const cashflow = await CashflowService.getCashflow(
                      getTodayParsedID(selectedRecord.date)
                    );
                    if (cashflow) {
                      cashflow!.records = cashflow!.records.filter((element) => {
                        return element.timelineId !== selectedRecord.timelineId;
                      });
                      await CashflowService.updateCashflow(cashflow!);
                    }
                  }
                }

                setLoading(false);
                setRecords(records.filter((e) => !selectedIDs.includes(e.timelineId)));
                setSelectedID([]);
              }}
            >
              <Button variant={"destructive"} size={"icon"} className="ml-3">
                <Trash className="size-5" />
              </Button>
            </ConfirmDialog>
          </motion.div>
        </div>
      </div>
      <div className="mt-2 border dark:border-primary rounded-lg flex p-3 px-10 gap-x-10 max-w-fit">
        <div className="flex flex-col items-start">
          <p className="font-medium flex gap-x-1 items-center">
            Income <TrendingUp className="size-5 text-green-500" />
          </p>
          <p>{formatNumberWithCommas(incomeCalculate(records))}</p>
        </div>
        <div className="flex flex-col items-start">
          <p className="font-medium flex gap-x-1 items-center">
            Outcome <TrendingDown className="size-5 text-red-500" />
          </p>
          <p>{formatNumberWithCommas(outcomeCalculate(records))}</p>
        </div>
        <div className="flex flex-col items-start">
          <p className="font-medium flex gap-x-1 items-center">
            Net <BadgeDollarSign className="size-5 text-zinc-500" />
          </p>
          <p>{formatNumberWithCommas(incomeCalculate(records) + outcomeCalculate(records))}</p>
        </div>
      </div>
      {loading && <LoadingWidget />}
      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={
                      selectedIDs.length === filteredRecords.length && selectedIDs.length > 0
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredRecords.map((e) => e.timelineId));
                      } else {
                        setSelectedID([]);
                      }
                    }}
                  />
                </TableHead>

                <TableHead className="flex flex-row items-center ">
                  <motion.div
                    initial={{
                      scale: 0,
                      width: 0
                    }}
                    animate={{
                      scale: selectedIDs.length === 0 ? 0 : "100%",
                      width: selectedIDs.length === 0 ? 0 : "auto"
                    }}
                  >
                    <span className="p-1 text-sm text-primary mr-2">{selectedIDs.length}</span>
                  </motion.div>
                  Name
                </TableHead>

                <TableHead>Amount</TableHead>
                <TableHead>Updated</TableHead>
                {/* <TableHead>Detail</TableHead> */}
                <TableHead className="rounded-tr-sm"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={7} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((timeline, index) => (
                  <CashDetailDialog record={timeline}>
                    <TableRow key={index} onClick={(event) => event.stopPropagation()}>
                      <TableCell>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(timeline.timelineId)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([timeline.timelineId, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== timeline.timelineId));
                            }
                          }}
                        />
                      </TableCell>

                      <TableCell>{timeline.name}</TableCell>
                      <TableCell
                        className={timeline.amount < 0 ? "text-red-500" : "text-green-500"}
                      >
                        {formatNumberWithCommas(timeline.amount)}
                      </TableCell>
                      <TableCell>{timeline.date.toLocaleDateString()}</TableCell>
                      {/* <CashDetailDialog record={timeline}>
                        <TableCell
                          className="text-primary text-sm cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          View Detail
                        </TableCell>
                      </CashDetailDialog> */}
                      <TableCell
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            onClick={(event) => {
                              event.stopPropagation();
                              event.preventDefault();
                            }}
                          >
                            <DropdownMenuGroup>
                              <TimelineDialog
                                title="Edit Cashflow"
                                actionTitle="Save"
                                editTimeline={timeline}
                                selectedDate={timeline.date}
                                onEdited={async (timeline) => {
                                  setLoading(true);
                                  const cashflow = await CashflowService.getCashflow(
                                    getTodayParsedID(timeline.date)
                                  );
                                  if (cashflow) {
                                    cashflow!.records = cashflow!.records!.filter(
                                      (element) => element.timelineId !== timeline.timelineId
                                    );
                                    cashflow!.records.push(timeline);
                                    await CashflowService.updateCashflow(cashflow!);
                                    toast({
                                      title: `Successfully updated to ${timeline.name}`
                                    });
                                    setRecords(
                                      records.map((e) =>
                                        e.timelineId === timeline.timelineId ? timeline : e
                                      )
                                    );
                                  }
                                  setLoading(false);
                                }}
                              >
                                <DropdownMenuItem
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                              </TimelineDialog>
                              <TimelineDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  const cashflow = await CashflowService.getCashflow(
                                    getTodayParsedID(timeline.date)
                                  );
                                  if (cashflow) {
                                    cashflow!.records = cashflow!.records.filter((element) => {
                                      return element.timelineId !== timeline.timelineId;
                                    });
                                    await CashflowService.updateCashflow(cashflow!);
                                    setRecords(
                                      records.filter((e) => e.timelineId !== timeline.timelineId)
                                    );
                                  }
                                  setLoading(false);
                                }}
                                title="Delete Cashflow"
                                description={`Are you sure to delete ${timeline.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </TimelineDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </CashDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredRecords.length}</p>
            <div className="flex items-center gap-x-3">
              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  if (paginateIndex <= 0) {
                    setPanigateIndex(0);
                    return;
                  }
                  setPanigateIndex(paginateIndex - 1);
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span>
                {paginateIndex + 1} - {chunkArray(filteredRecords, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredRecords, 10);
                  const lastIndex = chunks.length - 1;
                  if (paginateIndex >= lastIndex) {
                    return;
                  }
                  setPanigateIndex(paginateIndex + 1);
                }}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="h-[100px]"></div>
    </div>
  );
}
