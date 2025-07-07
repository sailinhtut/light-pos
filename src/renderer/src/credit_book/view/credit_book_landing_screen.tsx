import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useContext, useEffect, useState } from "react";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCcw,
  Settings2,
  Trash,
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
  parseNumber,
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
import CreditbookService from "../service/credit_book_service";
import { Creditbook } from "../interface/credit_book";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { useRouteContext } from "@renderer/router";
import { motion } from "framer-motion";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { AppContext } from "@renderer/app/context/app_context";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";

export default function CreditbookListPage() {
  const [_creditBooks, setCreditbooks] = useState<Creditbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);
  const { push } = useRouteContext();
  const [onlyCompletedBook, setOnlyCompletedBook] = useState(false);

  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

  useEffect(function () {
    fetchCreditbooks();
  }, []);

  const fetchCreditbooks = async () => {
    setLoading(true);
    const data = await CreditbookService.getCreditbooks();
    setCreditbooks(data);
    setLoading(false);
  };

  const filterCreditbooks = (origin: Creditbook[]) => {
    let filtered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.creditBookId.includes(query)
    );
    filtered = onlyCompletedBook
      ? filtered.filter((element) => element.completed)
      : filtered.filter((element) => !element.completed);

    if (sortLastest) {
      filtered.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
    } else {
      filtered.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    }
    return filtered;
  };

  const [sortLastest, setSortLastest] = useState(true);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const filteredCreditBooks = filterCreditbooks(_creditBooks ?? []);
  const paginatedData = paginator(filteredCreditBooks, paginateIndex, 10);

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Credit Book", route: "/settings/credit-book" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Credit Book</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2 ml-3"
            onClick={() => {
              if (!loading) {
                fetchCreditbooks();
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
          <CreditbookDialog
            title="Add Creditbook"
            actionTitle="Add"
            onCreated={async (creditBook) => {
              setLoading(true);
              const result = await CreditbookService.addCreditbook(creditBook);
              if (result) {
                toast({
                  title: `Successfully created ${creditBook.name}`
                });
                await fetchCreditbooks();
              }
              setLoading(false);
            }}
          >
            <Button className="mx-3">Add Book</Button>
          </CreditbookDialog>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant={"outline"} size={"icon"}>
                <Settings2 className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setOnlyCompletedBook(!onlyCompletedBook)}>
                  {onlyCompletedBook ? "Show Active Book" : "Show Completed Book"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortLastest(!sortLastest)}>
                  {sortLastest ? "Sort Earliest" : "Sort Lastest"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isCasher && (
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
                title="Delete Books"
                description="Are you sure to delete all selected books ?"
                actionTitle="Confirm"
                onConfirm={async () => {
                  setLoading(true);
                  for (const bookId of selectedIDs) {
                    const selectedBook = _creditBooks.find((e) => e.creditBookId === bookId);
                    if (selectedBook) {
                      await CreditbookService.deleteCreditbook(selectedBook.creditBookId);
                    }
                  }
                  setLoading(false);
                  setSelectedID([]);
                  await fetchCreditbooks();
                }}
              >
                <Button variant={"destructive"} size={"icon"} className="ml-3">
                  <Trash className="size-5" />
                </Button>
              </ConfirmDialog>
            </motion.div>
          )}
        </div>
      </div>
      {loading && <LoadingWidget />}
      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={
                      selectedIDs.length === filteredCreditBooks.length && selectedIDs.length > 0
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredCreditBooks.map((e) => e.creditBookId));
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
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                {!isCasher && <TableHead>Detail</TableHead>}
                {!isCasher && <TableHead className="rounded-tr-md"></TableHead>}
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
                paginatedData.map((creditBook, index) => (
                  <TableRow
                    key={creditBook.creditBookId}
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!isCasher) {
                        push(`/settings/credit-book/${creditBook.creditBookId}`);
                      }
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        className="border-slate-500 shadow-none ml-2"
                        checked={selectedIDs.includes(creditBook.creditBookId)}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={(value) => {
                          if (value) {
                            setSelectedID([creditBook.creditBookId, ...selectedIDs]);
                          } else {
                            setSelectedID(selectedIDs.filter((e) => e !== creditBook.creditBookId));
                          }
                        }}
                      />
                    </TableCell>

                    <TableCell>{creditBook.name}</TableCell>
                    <TableCell
                      className={creditBook.creditAmount > 0 ? "text-green-500" : "text-red-500"}
                    >
                      {formatNumberWithCommas(creditBook.creditAmount)}
                    </TableCell>
                    <TableCell
                      className={creditBook.completed ? "text-green-500" : "text-foreground"}
                    >
                      {creditBook.completed ? "Completed" : "Active"}
                    </TableCell>
                    <TableCell>{creditBook.updatedDate.toLocaleDateString()}</TableCell>
                    {/* {!isCasher && (
                      <TableCell
                        className="text-primary text-sm cursor-pointer"
                        onClick={() => {
                          push(`/settings/credit-book/${creditBook.creditBookId}`);
                        }}
                      >
                        View Detail
                      </TableCell>
                    )} */}
                    {!isCasher && (
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
                            <DropdownMenuGroup>
                              <CreditbookDialog
                                title="Edit Creditbook"
                                actionTitle="Save"
                                editCreditbook={creditBook}
                                onEdited={async (creditBook) => {
                                  setLoading(true);
                                  const result =
                                    await CreditbookService.updateCreditbook(creditBook);
                                  if (result) {
                                    toast({
                                      title: `Successfully updated to ${creditBook.name}`
                                    });
                                    await fetchCreditbooks();
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
                              </CreditbookDialog>
                              <CreditbookDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  await CreditbookService.deleteCreditbook(creditBook.creditBookId);
                                  fetchCreditbooks();
                                }}
                                title="Delete Creditbook"
                                description={`Are you sure to delete ${creditBook.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </CreditbookDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredCreditBooks.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredCreditBooks, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredCreditBooks, 10);
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

export function CreditbookDialog({
  onCreated,
  onEdited,
  editCreditbook,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (creditBook: Creditbook) => void;
  onEdited?: (creditBook: Creditbook) => void;
  editCreditbook?: Creditbook;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const creditBookForm = useForm<Creditbook>();
  const [open, setOpen] = useState(false);

  useEffect(function () {
    if (editCreditbook) {
      creditBookForm.setValue("creditBookId", editCreditbook.creditBookId);
      creditBookForm.setValue("name", editCreditbook.name);
      creditBookForm.setValue("note", editCreditbook.note);
      creditBookForm.setValue("createdBy", editCreditbook.createdBy);
      creditBookForm.setValue("createdDate", editCreditbook.createdDate);
      creditBookForm.setValue("updatedDate", editCreditbook.updatedDate);
      creditBookForm.setValue("creditAmount", editCreditbook.creditAmount);
      creditBookForm.setValue("completed", editCreditbook.completed);
      creditBookForm.setValue("parsedMonth", editCreditbook.parsedMonth);
      creditBookForm.setValue("records", editCreditbook.records);
      creditBookForm.setValue("attachedOrders", editCreditbook.attachedOrders);
    }
  }, []);

  const submit = (data: Creditbook) => {
    if (editCreditbook) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: Creditbook) => {
    const newCreditbook: Creditbook = {
      creditBookId: uniqueId(),
      name: data.name,
      note: data.note ?? "",
      createdBy: data.createdBy ?? "",
      createdDate: new Date(),
      updatedDate: new Date(),
      creditAmount: parseNumber(String(data.creditAmount)) ?? 0,
      completed: data.completed ?? false,
      parsedMonth: parseBookMonth(new Date()),
      records: [],
      attachedOrders: []
    };
    setOpen(false);
    onCreated?.(newCreditbook);
  };

  const editSubmit = async (data: Creditbook) => {
    data.updatedDate = new Date();
    data.creditAmount = parseInt(String(data.creditAmount));
    onEdited?.(data);
  };

  function parseBookMonth(date: Date): string {
    return `${date.getFullYear()}_${date.getMonth()}`;
  }

  const resetForm = () => {
    creditBookForm.reset({
      creditBookId: undefined,
      name: "",
      note: "",
      createdBy: "",
      createdDate: new Date(),
      updatedDate: new Date(),
      creditAmount: 0,
      completed: false,
      parsedMonth: "",
      records: [],
      attachedOrders: []
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
          <Form {...creditBookForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return creditBookForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editCreditbook && (
                <FormField
                  name="creditBookId"
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
                rules={{ required: "Creditbook name is required" }}
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
                name="creditAmount"
                rules={{
                  required: "Amount is required",
                  validate: (value) => !isNaN(value) || "Invalid Number"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="completed"
                render={({ field }) => (
                  <FormItem className="w-full flex justify-between items-center">
                    <FormLabel className="flex items-center">
                      Completed{" "}
                      {creditBookForm.watch("completed", false) && (
                        <BadgeCheck className="ml-2 text-green-500 size-5 drop-shadow-sm" />
                      )}{" "}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        className="scale-110"
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
                Created {creditBookForm.watch("createdDate", new Date()).toDateString()} - Updated{" "}
                {creditBookForm.watch("updatedDate", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => creditBookForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreditbookDeleteDialog({
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
