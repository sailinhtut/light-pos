import { useContext, useEffect, useState } from "react";
import { createSearchParams, useParams, useSearchParams } from "react-router-dom";
import CreditbookService from "../service/credit_book_service";
import { CashRecord, Creditbook } from "../interface/credit_book";
import {
  AudioWaveform,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Cross,
  Divide,
  MoreHorizontal,
  PlugZap,
  RefreshCcw,
  UserRound,
  X
} from "lucide-react";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import LoadingWidget from "@renderer/app/view/components/loading";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import {
  chunkArray,
  formatNumberWithCommas,
  getTodayParsedID,
  getUnParsedDate,
  paginator,
  parseNumber,
  uniqueId
} from "@renderer/utils/general_utils";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { useRouteContext } from "@renderer/router";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import moment from "moment";
import { AppContext } from "@renderer/app/context/app_context";

export default function CreditbookDetailPage() {
  const { creditBookId } = useParams();
  const [searchParams] = useSearchParams();

  const [creditBook, setCreditbook] = useState<Creditbook | undefined>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const { push } = useRouteContext();
  const { currency } = useContext(AppContext);

  useEffect(function () {
    fetchBook();
  }, []);

  const fetchBook = async () => {
    setLoading(true);
    if (creditBookId) {
      const data = await CreditbookService.getCreditbook(creditBookId);
      setCreditbook(data);
    }
    setLoading(false);
  };

  const filterRecords = (origin: CashRecord[]) => {
    return origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.cashRecordId.includes(query)
    );
  };

  const fileredRecords = filterRecords(creditBook?.records ?? []);
  const paginatedData = paginator(fileredRecords, paginateIndex, 10);

  return (
    <div className={`p-5`}>
      {searchParams.get("orderId") ? (
        <BreadcrumbContext
          route={[
            { name: "Light POS", route: "/" },
            { name: "Active Orders", route: "/order-active" },
            {
              name: "Order History",
              route: `/order-history/${searchParams.get("date") ?? getTodayParsedID(new Date())}`
            },
            {
              name: searchParams.get("customerName") ?? searchParams.get("orderId") ?? "Order",
              route: `/order-history/${searchParams.get("date") ?? getTodayParsedID(new Date())}/${searchParams.get("orderId")}`
            },
            {
              name: creditBook?.name ?? creditBookId ?? "",
              route: `/order-history/credit-book/${creditBookId}`
            }
          ]}
        />
      ) : (
        <BreadcrumbContext
          route={[
            { name: "Light POS", route: "/" },
            { name: "Setting", route: "/settings" },
            { name: "Credit Book", route: "/settings/credit-book" },
            {
              name: creditBook?.name ?? creditBookId ?? "",
              route: `/settings/credit-book/${creditBookId}`
            }
          ]}
        />
      )}

      {loading && <LoadingWidget />}
      {!loading && !creditBook && (
        <p className="flex gap-x-2 items-center">
          <PlugZap className="size-6 text-amber-400" />
          No credit book is found
        </p>
      )}
      {!loading && creditBook && (
        <div className="flex gap-y-1 flex-col">
          <p className="text-lg flex items-center gap-x-5">
            {creditBook.name}
            <div
              className={
                creditBook.completed
                  ? "h-5 flex items-center px-2 py-0 text-xs border-slate-200 drop-shadow-sm rounded-full bg-green-700 text-slate-50"
                  : "h-5 flex items-center px-2 py-0 text-xs border-slate-200 drop-shadow-sm rounded-full bg-amber-600 text-slate-50"
              }
            >
              {creditBook.completed ? "Completed" : "Pending Credit"}
              {creditBook.completed ? (
                <BadgeCheck className="ml-2 text-slate-50 size-4 drop-shadow-sm" />
              ) : (
                <UserRound className="ml-2 text-slate-50 size-4 drop-shadow-sm" />
              )}
            </div>
          </p>
          <p className="select-none">
            Left Amount - {formatNumberWithCommas(creditBook.creditAmount)} {"  "} {currency} (
            {moment(creditBook.createdDate).format("hh:mm DD/MM/y")} -{" "}
            {moment(creditBook.updatedDate).format("hh:mm DD/MM/y")})
          </p>
          <p className="mt-4">Note</p>
          {creditBook.note && <p className="text-sm">{creditBook.note}</p>}
          <p className="mt-4">Attached Orders</p>
          {creditBook.attachedOrders.length === 0 ? (
            <p className="text-xs text-slate-500">No Attached Order</p>
          ) : (
            <div className="flex flex-wrap gap-x-3 mt-2">
              {creditBook.attachedOrders.map((record, index) => (
                <Button key={index} variant={"outline"} className="rounded-lg mr-3">
                  <span
                    onClick={() =>
                      push(`/order-history/${record.orderCollectionName}/${record.orderId}`, {
                        breadcumbRoutes: JSON.stringify([
                          // { name: "Active Orders", route: "/order-active" },
                          // {
                          //   name: "Order History",
                          //   route: `/order-history/${getTodayParsedID(getUnParsedDate(record.orderCollectionName))}`
                          // }
                        
                          { name: "Setting", route: "/settings" },
                          { name: "Credit Book", route: "/settings/credit-book" },
                          {
                            name: creditBook?.name ?? creditBookId ?? "",
                            route: `/settings/credit-book/${creditBookId}`
                          }
                        ])
                      })
                    }
                  >
                    {record.orderShortName}
                  </span>
                  <ConfirmDialog
                    actionVariant={"destructive"}
                    actionTitle="Delete"
                    title={`Delete ${record.orderShortName}`}
                    description={`Are you sure to delete ${record.orderShortName} ?`}
                    onConfirm={async () => {
                      setLoading(true);
                      creditBook.attachedOrders = creditBook.attachedOrders.filter(
                        (e) => e.orderId !== record.orderId
                      );
                      await CreditbookService.updateCreditbook(creditBook);
                      setLoading(false);
                    }}
                  >
                    <X className="text-slate-500 size-5 hover:text-red-500 ml-2" />
                  </ConfirmDialog>
                </Button>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <p>Credit Record</p>
            <div className="flex gap-x-3">
              <Button
                variant={"ghost"}
                className="w-[40px] px-2"
                onClick={() => {
                  if (!loading) {
                    fetchBook();
                  }
                }}
              >
                <RefreshCcw
                  className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
                />
              </Button>
              <Input
                placeholder="Search"
                onChange={(event) => setQuery(event.target.value)}
                value={query}
              ></Input>
              <CashRecordDialog
                title="Add Credit Record"
                actionTitle="Add"
                onCreated={async (record) => {
                  setLoading(true);
                  creditBook.records.push(record);
                  if (record.cashIn) {
                    creditBook.creditAmount -= record.amount;
                  } else {
                    creditBook.creditAmount += record.amount;
                  }
                  creditBook.updatedDate = new Date();

                  await CreditbookService.updateCreditbook(creditBook);
                  toast({
                    title: `Successfully created ${record.name}`
                  });
                  await fetchBook();
                }}
              >
                <Button>Add Record</Button>
              </CashRecordDialog>
            </div>
          </div>

          <div className="border rounded-md mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 rounded-tl-md">No</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="rounded-tr-md"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!paginatedData && (
                  <TableRow>
                    <TableCell colSpan={5} className="pl-5 text-slate-500">
                      No Data
                    </TableCell>
                  </TableRow>
                )}
                {paginatedData &&
                  paginatedData.map((record, index) => (
                    <CashRecordDetailDialog record={record}>
                      <TableRow key={record.cashRecordId} className="cursor-pointer">
                        <TableCell className="pl-5">{index + 1}</TableCell>
                        <TableCell>{record.cashRecordId}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell
                          className={`${record.cashIn ? "text-green-500" : "text-red-500"}`}
                        >
                          {formatNumberWithCommas(record.amount)}
                        </TableCell>
                        <TableCell>{moment(record.date).format("hh:mm DD/MM/y")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                            >
                              <CashRecordDialog
                                title="Edit Credit Record"
                                actionTitle="Save"
                                editCashRecord={record}
                                onEdited={async (record) => {
                                  setLoading(true);
                                  creditBook.records = creditBook.records.filter(
                                    (element) => element.cashRecordId !== record.cashRecordId
                                  );
                                  creditBook.records.push(record);
                                  creditBook.updatedDate = new Date();
                                  await CreditbookService.updateCreditbook(creditBook);
                                  toast({
                                    title: `Successfully updated to ${record.name}`
                                  });
                                  await fetchBook();
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
                              </CashRecordDialog>
                              <CashRecordDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  creditBook.records = creditBook.records.filter(
                                    (element) => element.cashRecordId !== record.cashRecordId
                                  );
                                  await CreditbookService.updateCreditbook(creditBook);
                                  fetchBook();
                                }}
                                title="Delete Credit Record"
                                description={`Are you sure to delete ${creditBook.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </CashRecordDeleteDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </CashRecordDetailDialog>
                  ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-3 py-2 border-t ">
              <p className="text-sm">Total {fileredRecords.length}</p>
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
                  {paginateIndex + 1} - {chunkArray(fileredRecords, 10).length}
                </span>

                <Button
                  className="px-1 h-7"
                  variant={"outline"}
                  onClick={() => {
                    const chunks = chunkArray(fileredRecords, 10);
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
        </div>
      )}
    </div>
  );
}

function CashRecordDialog({
  onCreated,
  onEdited,
  editCashRecord,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (cashRecord: CashRecord) => void;
  onEdited?: (cashRecord: CashRecord) => void;
  editCashRecord?: CashRecord;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const cashRecordForm = useForm<CashRecord>();
  const [open, setOpen] = useState(false);

  useEffect(function () {
    if (editCashRecord) {
      cashRecordForm.setValue("cashRecordId", editCashRecord.cashRecordId);
      cashRecordForm.setValue("name", editCashRecord.name);
      cashRecordForm.setValue("note", editCashRecord.note);
      cashRecordForm.setValue("amount", editCashRecord.amount);
      cashRecordForm.setValue("date", editCashRecord.date);
      cashRecordForm.setValue("cashIn", editCashRecord.cashIn);
      cashRecordForm.setValue("attachedOrderId", editCashRecord.attachedOrderId);
    }
  }, []);

  const submit = (data: CashRecord) => {
    if (editCashRecord) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: CashRecord) => {
    const newCashRecord: CashRecord = {
      cashRecordId: uniqueId(),
      name: data.name ?? "",
      note: data.note ?? "",
      date: new Date(),
      amount: parseNumber(String(data.amount)) ?? 0,
      cashIn: data.cashIn,
      attachedOrderId: null
    };
    setOpen(false);
    onCreated?.(newCashRecord);
  };

  const editSubmit = async (data: CashRecord) => {
    data.date = new Date();
    data.amount = parseNumber(String(data.amount)) ?? 0;

    onEdited?.(data);
  };

  const resetForm = () => {
    cashRecordForm.reset({
      cashRecordId: "",
      attachedOrderId: null,
      name: "",
      amount: 0,
      note: "",
      date: new Date(),
      cashIn: true
    });
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
          <Form {...cashRecordForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return cashRecordForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editCashRecord && (
                <FormField
                  name="cashRecordId"
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
                rules={{ required: "Cash record name is required" }}
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
                  required: "Amount is required",
                  validate: (value) => !isNaN(value) || "Invalid Number"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={editCashRecord !== undefined}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="cashIn"
                defaultValue={true}
                render={({ field }) => (
                  <FormItem className="w-full flex justify-between items-center">
                    <FormLabel
                      className={
                        cashRecordForm.watch("cashIn", true) ? "text-green-500" : "text-red-500"
                      }
                    >
                      {cashRecordForm.watch("cashIn", true) ? "Get Credit" : "Give Credit"}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        className="scale-110"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={editCashRecord !== undefined}
                      ></Switch>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
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
                Created {cashRecordForm.watch("date", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => cashRecordForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashRecordDeleteDialog({
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

function CashRecordDetailDialog({
  record,
  children
}: {
  record: CashRecord;
  children: React.ReactNode;
}) {
  const { currency } = useContext(AppContext);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-y-scroll max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{record.name}</DialogTitle>
          <DialogDescription>{record.note}</DialogDescription>
        </DialogHeader>
        <p className="text-sm my-0">
          Amount -{" "}
          <span>
            {formatNumberWithCommas(record.amount)} {currency}
          </span>
        </p>
        <p className="text-sm my-0">
          Type -{" "}
          <span className={record.cashIn ? "text-green-500" : "text-red-500"}>
            {record.cashIn ? "Cash In" : "Cash Out"}
          </span>
        </p>

        <p className="text-sm my-0">
          Created Date - {moment(record.date).format("hh:mm:ss MMM d y")}
        </p>
        <p className="text-sm my-0">ID - {record.attachedOrderId}</p>

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
