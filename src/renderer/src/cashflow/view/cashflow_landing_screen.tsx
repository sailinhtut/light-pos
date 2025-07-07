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
import { Cashflow, Timeline } from "../interface/cashflow";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { FileImage } from "@renderer/app/view/components/file_image";
import { date } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { Calendar } from "@renderer/assets/shadcn/components/ui/calendar";
import { useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { motion } from "framer-motion";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { AppContext } from "@renderer/app/context/app_context";
import moment from "moment";

export default function CashflowLandingPage() {
  const [cashflow, setCashflow] = useState<Cashflow>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [sortLastest, setSortLastest] = useState(true);
  const [cashMode, setCashMode] = useState(0);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  useEffect(function () {
    fetchCashflows(selectedDate!);
  }, []);

  const fetchCashflows = async (fetchDate: Date | undefined) => {
    setLoading(true);
    const data = await CashflowService.getCashflow(getTodayParsedID(fetchDate));
    setCashflow(data);
    setLoading(false);
  };

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

    if (cashMode === 1) {
      filtered = filtered.filter((e) => e.amount > 0);
    } else if (cashMode === 2) {
      filtered = filtered.filter((e) => e.amount < 0);
    }
    return filtered;
  };

  const extractIncome = (records: Timeline[]) => {
    if (records.length === 0) return 0;
    const allIncome = records
      .filter((element) => element.amount > 0)
      .map((element) => element.amount);
    if (allIncome.length === 0) return 0;
    return allIncome.reduce((a, b) => a + b);
  };
  const extractOutcome = (records: Timeline[]) => {
    if (records.length === 0) return 0;
    const allIncome = records
      .filter((element) => element.amount <= 0)
      .map((element) => element.amount);
    if (allIncome.length === 0) return 0;
    return allIncome.reduce((a, b) => a + b);
  };

  const filteredRecords = filterCashflows(cashflow?.records ?? []);
  const paginatedData = paginator(filteredRecords, paginateIndex, 10);

  return (
    <div className="p-5 overflow-x-hidden">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Cashflow", route: "/cashflow" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Cashflow</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchCashflows(selectedDate);
              }
            }}
          >
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            className="ml-3"
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <TimelineDialog
            title="Add Cashflow"
            actionTitle="Add"
            selectedDate={selectedDate}
            onCreated={async (timeline) => {
              setLoading(true);
              const editMode = cashflow !== undefined;
              const currentCash: Cashflow = editMode
                ? cashflow!
                : {
                    cashflowId: getTodayParsedID(selectedDate),
                    date: selectedDate ?? new Date(),
                    records: []
                  };
              currentCash.records.push(timeline);

              if (editMode) {
                const result = await CashflowService.updateCashflow(currentCash);
                if (result) {
                  toast({
                    title: `Successfully updated ${timeline.name}`
                  });
                  await fetchCashflows(selectedDate);
                }
              } else {
                const result = await CashflowService.addCashflow(currentCash);
                if (result) {
                  toast({
                    title: `Successfully created ${timeline.name}`
                  });
                  await fetchCashflows(selectedDate);
                }
              }

              setLoading(false);
            }}
          >
            <Button className="ml-3">Add Cash</Button>
          </TimelineDialog>
          <Popover>
            <PopoverTrigger>
              <Button variant={"outline"} className="mx-3">
                {selectedDate?.toDateString() ?? "Choose Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date ?? new Date());
                  fetchCashflows(date);
                }}
              ></Calendar>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant={"outline"} size={"icon"}>
                <Settings2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => setCashMode(cashMode === 0 ? 1 : cashMode === 1 ? 2 : 0)}
                >
                  {cashMode === 0
                    ? "Show Only Cash In"
                    : cashMode === 1
                      ? "Show Only Cash Out"
                      : "Show All Cash"}
                </DropdownMenuItem>
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
                if (!cashflow) return;
                setLoading(true);
                for (const recordId of selectedIDs) {
                  const selectedRecord = cashflow!.records.find((e) => e.timelineId === recordId);
                  if (selectedRecord) {
                    cashflow!.records = cashflow!.records.filter((element) => {
                      return element.timelineId !== selectedRecord.timelineId;
                    });
                  }
                }
                await CashflowService.updateCashflow(cashflow!);
                setLoading(false);
                setSelectedID([]);
                fetchCashflows(selectedDate ?? new Date());
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
          <p>{formatNumberWithCommas(extractIncome(filteredRecords))}</p>
        </div>
        <div className="flex flex-col items-start">
          <p className="font-medium flex gap-x-1 items-center">
            Outcome <TrendingDown className="size-5 text-red-500" />
          </p>
          <p>{formatNumberWithCommas(extractOutcome(filteredRecords))}</p>
        </div>
        <div className="flex flex-col items-start">
          <p className="font-medium flex gap-x-1 items-center">
            Net <BadgeDollarSign className="size-5 text-zinc-500" />
          </p>
          <p>
            {formatNumberWithCommas(
              extractIncome(filteredRecords) + extractOutcome(filteredRecords)
            )}
          </p>
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
            </TableHeader>{" "}
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={5} className="pl-5 text-slate-500">
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
                                selectedDate={selectedDate}
                                onEdited={async (timeline) => {
                                  setLoading(true);
                                  cashflow!.records = cashflow!.records!.filter(
                                    (element) => element.timelineId !== timeline.timelineId
                                  );
                                  cashflow!.records.push(timeline);
                                  const result = await CashflowService.updateCashflow(cashflow!);
                                  if (result) {
                                    toast({
                                      title: `Successfully updated to ${timeline.name}`
                                    });
                                    await fetchCashflows(selectedDate);
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
                                  cashflow!.records = cashflow!.records.filter((element) => {
                                    return element.timelineId !== timeline.timelineId;
                                  });
                                  await CashflowService.updateCashflow(cashflow!);
                                  fetchCashflows(selectedDate);
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

export function TimelineDialog({
  onCreated,
  onEdited,
  editTimeline,
  selectedDate,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (cashflow: Timeline) => void;
  onEdited?: (cashflow: Timeline) => void;
  editTimeline?: Timeline;
  selectedDate: Date;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const timelineForm = useForm<Timeline>();
  const [open, setOpen] = useState(false);
  const [income, setIncome] = useState(true);

  useEffect(
    function () {
      if (editTimeline) {
        timelineForm.setValue("timelineId", editTimeline.timelineId);
        timelineForm.setValue("name", editTimeline.name);
        timelineForm.setValue("note", editTimeline.note);
        timelineForm.setValue("amount", editTimeline.amount);
        setIncome(editTimeline.amount > 0);
      }
      timelineForm.setValue("date", selectedDate);
    },
    [selectedDate]
  );

  const submit = (data: Timeline) => {
    if (editTimeline) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: Timeline) => {
    const newTimeline: Timeline = {
      timelineId: uniqueId(),
      name: data.name ?? "",
      note: data.note ?? "",
      date: selectedDate,
      recordDate: getTodayParsedID(selectedDate),
      amount: income ? Math.abs(data.amount ?? 0) : Math.abs(data.amount ?? 0) * -1
    };
    setOpen(false);
    onCreated?.(newTimeline);
  };

  const editSubmit = async (data: Timeline) => {
    data.amount = income ? Math.abs(data.amount ?? 0) : Math.abs(data.amount ?? 0) * -1;
    setOpen(false);
    onEdited?.(data);
  };

  const resetForm = () => {
    timelineForm.reset({
      name: "",
      note: "",
      amount: 0,
      date: selectedDate
    });
    setIncome(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(status) => {
        setOpen(status);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-y-scroll max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Form {...timelineForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return timelineForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editTimeline && (
                <FormField
                  name="timelineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input {...field} disabled></Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              )}
              <FormField
                name="name"
                rules={{
                  required: "Timeline name is required"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="amount"
                rules={{
                  required: "Timeline amount is required",
                  validate: (value) => !isNaN(value) || "Invalid Number"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number"></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <div
                className={
                  income
                    ? "w-full px-3 py-1.5 cursor-pointer transition-all duration-200 active:scale-95 text-white font-medium text-center rounded-lg drop-shadow bg-green-500 select-none"
                    : "w-full px-3 py-1.5 cursor-pointer transition-all duration-200 active:scale-95 text-white font-medium text-center rounded-lg drop-shadow bg-red-500 select-none"
                }
                onClick={() => setIncome(!income)}
              >
                {income ? "Cash In" : "Cash Out"}
              </div>
              <FormField
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea {...field}></Textarea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <p className="text-sm text-slate-500">
                Created {timelineForm.watch("date", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => timelineForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TimelineDeleteDialog({
  onConfirmed,
  title,
  description,
  actionTitle,
  children
}: {
  onConfirmed?: () => void;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button
            variant={"destructive"}
            onClick={() => {
              setOpen(false);
              onConfirmed?.();
            }}
          >
            {actionTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CashDetailDialog({
  record,
  children
}: {
  record: Timeline;
  children: React.ReactNode;
}) {
  const { currency } = useContext(AppContext);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="overflow-y-scroll max-h-[80vh]"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{record.name}</DialogTitle>
          <DialogDescription>{record.note}</DialogDescription>
        </DialogHeader>
        <p className="text-sm my-0">
          Amount -{" "}
          <span>
            {formatNumberWithCommas(Math.abs(record.amount))} {currency}
          </span>
        </p>
        <p className="text-sm my-0">
          Type -{" "}
          <span className={record.amount > 0 ? "text-green-500" : "text-red-500"}>
            {record.amount > 0 ? "Cash In" : "Cash Out"}
          </span>
        </p>

        <p className="text-sm my-0">Date - {moment(record.date).format("hh:mm:ss MMM d y")}</p>
        <p className="text-sm my-0">ID - {record.timelineId}</p>

        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"} size={"sm"}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
