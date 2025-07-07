import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useEffect, useState } from "react";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
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
import { chunkArray, paginator, uniqueId } from "@renderer/utils/general_utils";
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
import CustomerService from "../service/customer_service";
import { Customer } from "../interface/customer";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { FileImage } from "@renderer/app/view/components/file_image";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { SupplierDetailDialog } from "@renderer/supplier/view/supplier_landing_screen";
import moment from "moment";
import CustomerImageService from "../service/customer_image_local_service";
import { Base64ImageViewer } from "@renderer/app/view/components/image_viewer";
import { browserReadFileBytes } from "@renderer/utils/file_utils";
import { arrayBufferToBase64 } from "@renderer/utils/encrypt_utils";

export default function CustomerListPage() {
  const [_customers, setCustomers] = useState<Customer[]>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  useEffect(function () {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await CustomerService.getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  const filterCustomers = (origin: Customer[]) => {
    let filtered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.customerId.includes(query)
    );

    if (sortLastest) {
      filtered.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    } else {
      filtered.sort((a, b) => a.updated_at.getTime() - b.updated_at.getTime());
    }
    return filtered;
  };

  const [sortLastest, setSortLastest] = useState(true);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const filteredCustomers = filterCustomers(_customers ?? []);
  const paginatedData = paginator(filteredCustomers, paginateIndex, 10);

  return (
    <div className={`p-5 overflow-x-hidden`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Customer", route: "/settings/customer" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Customer List</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchCustomers();
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
          <CustomerDialog
            title="Add Customer"
            actionTitle="Add"
            onCreated={async (customer) => {
              setLoading(true);
              const result = await CustomerService.addCustomer(customer);
              if (result) {
                toast({
                  title: `Successfully created ${customer.name}`
                });
                await fetchCustomers();
              }
              setLoading(false);
            }}
          >
            <Button className="mx-3">Add Customer</Button>
          </CustomerDialog>

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
              title="Delete Customer"
              description="Are you sure to delete all selected customers ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const customerId of selectedIDs) {
                  await CustomerService.deleteCustomer(customerId);
                }
                setLoading(false);
                setSelectedID([]);
                fetchCustomers();
              }}
            >
              <Button variant={"destructive"} size={"icon"} className="ml-3">
                <Trash className="size-5" />
              </Button>
            </ConfirmDialog>
          </motion.div>
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
                      selectedIDs.length === filteredCustomers.length && selectedIDs.length > 0
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredCustomers.map((e) => e.customerId));
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
                <TableHead>Updated</TableHead>
                {/* <TableHead>Detail</TableHead> */}
                <TableHead className="rounded-md"></TableHead>
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
                paginatedData.map((customer, index) => (
                  <CustomerDetailDialog customer={customer}>
                    <TableRow
                      key={customer.customerId}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TableCell>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(customer.customerId)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([customer.customerId, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== customer.customerId));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.updated_at.toLocaleDateString()}</TableCell>
                      {/* <CustomerDetailDialog customer={customer}>
                        <TableCell
                          className="text-primary text-sm cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          View Detail
                        </TableCell>
                      </CustomerDetailDialog> */}
                      <TableCell
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
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
                            }}
                          >
                            <DropdownMenuGroup>
                              <CustomerDialog
                                title="Edit Customer"
                                actionTitle="Save"
                                editCustomer={customer}
                                onEdited={async (Customer) => {
                                  setLoading(true);
                                  const result = await CustomerService.updateCustomer(Customer);
                                  if (result) {
                                    toast({
                                      title: `Successfully updated to ${Customer.name}`
                                    });
                                    await fetchCustomers();
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
                              </CustomerDialog>
                              <CustomerDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  await CustomerService.deleteCustomer(customer.customerId);
                                  fetchCustomers();
                                }}
                                title="Delete Customer"
                                description={`Are you sure to delete ${customer.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </CustomerDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </CustomerDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredCustomers.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredCustomers, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredCustomers, 10);
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

function CustomerDialog({
  onCreated,
  onEdited,
  editCustomer,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (customer: Customer) => void;
  onEdited?: (customer: Customer) => void;
  editCustomer?: Customer;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const customerForm = useForm<Customer>();
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(function () {
    if (editCustomer) {
      customerForm.setValue("customerId", editCustomer.customerId);
      customerForm.setValue("name", editCustomer.name);
      customerForm.setValue("note", editCustomer.note);
      customerForm.setValue("phoneOne", editCustomer.phoneOne);
      customerForm.setValue("phoneTwo", editCustomer.phoneTwo);
      customerForm.setValue("created_at", editCustomer.created_at);
      customerForm.setValue("updated_at", editCustomer.updated_at);
      loadImages();
    }
  }, []);

  const loadImages = async () => {
    const data = await CustomerImageService.getImage(editCustomer!.customerId);
    setAttachments(data);
  };

  const submit = (data: Customer) => {
    if (editCustomer) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: Customer) => {
    const newCustomer: Customer = {
      customerId: uniqueId(),
      name: data.name ?? "",
      note: data.note ?? "",
      phoneOne: data.phoneOne,
      phoneTwo: data.phoneTwo,
      created_at: data.created_at ?? new Date(),
      updated_at: new Date(),
      attachments: []
    };
    if (attachments.length > 0) {
      await CustomerImageService.addImage(newCustomer.customerId, attachments);
    }
    setOpen(false);
    onCreated?.(newCustomer);
  };

  const editSubmit = async (data: Customer) => {
    data.updated_at = new Date();
    data.attachments = [];
    if (attachments.length > 0) {
      await CustomerImageService.addImage(editCustomer!.customerId, attachments);
    }
    setOpen(false);
    onEdited?.(data);
  };

  const resetForm = () => {
    setAttachments([]);
    customerForm.reset({
      name: "",
      attachments: [],
      updated_at: new Date(),
      created_at: new Date(),
      note: "",
      phoneOne: "",
      phoneTwo: "",
      customerId: ""
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
          <Form {...customerForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return customerForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editCustomer && (
                <FormField
                  name="customerId"
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
                rules={{ required: "Customer name is required" }}
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
                name="phoneOne"
                rules={{ required: "Phone One is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone One</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="phoneTwo"
                rules={{ required: "Phone Two is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Two</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
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
              <FormItem className="flex justify-between items-center">
                <FormLabel>Attachments</FormLabel>
                <FormControl>
                  <Input
                    className="w-[200px]"
                    placeholder="Choose"
                    type="file"
                    multiple
                    onChange={async (event) => {
                      if (event.target.files) {
                        const selectedImageBytes: string[] = [];
                        const selectedFiles = Array.from(event.target.files);

                        for (const file of selectedFiles) {
                          const bytes = await browserReadFileBytes(file);
                          const base64String = arrayBufferToBase64(bytes);
                          selectedImageBytes.push(base64String);
                        }
                        setAttachments([...attachments, ...selectedImageBytes]);
                      }
                    }}
                  ></Input>
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className="flex gap-x-5 overflow-x-scroll py-3">
                {attachments &&
                  attachments.map((imageData, index) => (
                    <span key={index} className="relative min-w-fit">
                      <Base64ImageViewer
                        title={customerForm.watch("name") ?? "Attachment"}
                        base64String={imageData}
                      >
                        <img
                          src={`data:image/png;base64,${imageData}`}
                          alt={`Supplier Attachment ${index + 1}`}
                          className="h-[140px] aspect-auto rounded-lg border-slate-300 shadow"
                        ></img>
                      </Base64ImageViewer>
                      <X
                        className="absolute right-1 top-1 text-white drop-shadow hover:text-red-500"
                        onClick={() =>
                          setAttachments(attachments.filter((element) => element !== imageData))
                        }
                      />
                    </span>
                  ))}
              </div>

              <p className="text-sm text-slate-500">
                Created {customerForm.watch("created_at", new Date()).toDateString()} - Updated{" "}
                {customerForm.watch("updated_at", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => customerForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDeleteDialog({
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

export function CustomerDetailDialog({
  customer,
  children
}: {
  customer: Customer;
  children: React.ReactNode;
}) {
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const data = await CustomerImageService.getImage(customer.customerId);
    setAttachments(data);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="overflow-y-scroll max-h-[80vh]"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
          <DialogDescription>{customer.note}</DialogDescription>
        </DialogHeader>
        <p className="text-sm my-0">Phone 1 - {customer.phoneOne}</p>
        <p className="text-sm my-0">Phone 2 - {customer.phoneTwo}</p>
        <p className="text-sm my-0">
          Created Date - {moment(customer.created_at).format("hh:mm:ss MMM d y")}
        </p>
        <p className="text-sm my-0">
          Updated Date - {moment(customer.updated_at).format("hh:mm:ss MMM d y")}
        </p>
        <p className="text-sm my-0">ID - {customer.customerId}</p>
        <div className="flex gap-x-5 mt-3 overflow-x-scroll py-3">
          {attachments &&
            attachments.map((imageData, index) => (
              <span key={index} className="relative min-w-fit">
                <Base64ImageViewer title={customer.name} base64String={imageData}>
                  <img
                    src={`data:image/png;base64,${imageData}`}
                    alt={`Supplier Attachment ${index + 1}`}
                    className="h-[140px] aspect-auto rounded-lg border-slate-300 shadow"
                  ></img>
                </Base64ImageViewer>
              </span>
            ))}
        </div>
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
