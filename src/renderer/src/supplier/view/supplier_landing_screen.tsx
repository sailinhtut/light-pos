import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useContext, useEffect, useState } from "react";
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
import { chunkArray, paginator, parseNumber, uniqueId } from "@renderer/utils/general_utils";
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
import SupplierService from "../service/supplier_service";
import { Supplier } from "../interface/supplier";
import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { FileImage } from "@renderer/app/view/components/file_image";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { AppContext } from "@renderer/app/context/app_context";
import moment from "moment";
import { browserReadFileBytes, generateDownloadBytes } from "@renderer/utils/file_utils";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@renderer/utils/encrypt_utils";
import SupplierImageService from "../service/supplier_image_local_service";
import { Base64ImageViewer } from "@renderer/app/view/components/image_viewer";

export default function SupplierListPage() {
  const [_suppliers, setSuppliers] = useState<Supplier[]>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  useEffect(function () {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await SupplierService.getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  const filterSuppliers = (origin: Supplier[]) => {
    let filtered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.supplierId.includes(query)
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

  const filteredSuppliers = filterSuppliers(_suppliers ?? []);
  const paginatedData = paginator(filteredSuppliers, paginateIndex, 10);

  return (
    <div className={`p-5 overflow-x-hidden`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Supplier", route: "/settings/supplier" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Supplier List</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchSuppliers();
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
          <SupplierDialog
            title="Add Supplier"
            actionTitle="Add"
            onCreated={async (supplier) => {
              setLoading(true);
              const result = await SupplierService.addSupplier(supplier);
              if (result) {
                toast({
                  title: `Successfully created ${supplier.name}`
                });
                await fetchSuppliers();
              }
              setLoading(false);
            }}
          >
            <Button className="mx-3">Add Supplier</Button>
          </SupplierDialog>

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
              title="Delete Supplier"
              description="Are you sure to delete all selected suppliers ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                for (const supplierId of selectedIDs) {
                  await SupplierService.deleteSupplier(supplierId);
                }
                setLoading(false);
                setSelectedID([]);
                fetchSuppliers();
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
                      selectedIDs.length === filteredSuppliers.length && selectedIDs.length > 0
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredSuppliers.map((e) => e.supplierId));
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
                paginatedData.map((supplier, index) => (
                  <SupplierDetailDialog supplier={supplier}>
                    <TableRow
                      key={supplier.supplierId}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TableCell>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(supplier.supplierId)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([supplier.supplierId, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== supplier.supplierId));
                            }
                          }}
                        />
                      </TableCell>

                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.updated_at.toLocaleDateString()}</TableCell>
                      {/* <SupplierDetailDialog supplier={supplier}>
                        <TableCell
                          className="text-primary text-sm cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          View Detail
                        </TableCell>
                      </SupplierDetailDialog> */}
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
                              <SupplierDialog
                                title="Edit Supplier"
                                actionTitle="Save"
                                editSupplier={supplier}
                                onEdited={async (supplier) => {
                                  setLoading(true);
                                  const result = await SupplierService.updateSupplier(supplier);
                                  if (result) {
                                    toast({
                                      title: `Successfully updated to ${supplier.name}`
                                    });
                                    await fetchSuppliers();
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
                              </SupplierDialog>
                              <SupplierDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  await SupplierService.deleteSupplier(supplier.supplierId);
                                  fetchSuppliers();
                                }}
                                title="Delete Supplier"
                                description={`Are you sure to delete ${supplier.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </SupplierDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </SupplierDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredSuppliers.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredSuppliers, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredSuppliers, 10);
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

function SupplierDialog({
  onCreated,
  onEdited,
  editSupplier,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (supplier: Supplier) => void;
  onEdited?: (supplier: Supplier) => void;
  editSupplier?: Supplier;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const supplierForm = useForm<Supplier>();
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(function () {
    if (editSupplier) {
      supplierForm.setValue("supplierId", editSupplier.supplierId);
      supplierForm.setValue("name", editSupplier.name);
      supplierForm.setValue("note", editSupplier.note);
      supplierForm.setValue("phoneOne", editSupplier.phoneOne);
      supplierForm.setValue("itemName", editSupplier.itemName);
      supplierForm.setValue("amount", editSupplier.amount);
      supplierForm.setValue("quantity", editSupplier.quantity);
      supplierForm.setValue("payAmount", editSupplier.payAmount);
      supplierForm.setValue("leftAmount", editSupplier.leftAmount);
      supplierForm.setValue("created_at", editSupplier.created_at);
      supplierForm.setValue("updated_at", editSupplier.updated_at);
      loadImages();
    }
  }, []);

  const loadImages = async () => {
    const data = await SupplierImageService.getImage(editSupplier!.supplierId);
    setAttachments(data);
  };

  const submit = (data: Supplier) => {
    if (editSupplier) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
    resetForm();
  };

  const createSubmit = async (data: Supplier) => {
    const newSupplier: Supplier = {
      supplierId: uniqueId(),
      name: data.name ?? "",
      note: data.note ?? "",
      phoneOne: data.phoneOne,
      itemName: data.itemName,
      amount: parseNumber(String(data.amount)) ?? 0,
      quantity: parseNumber(String(data.quantity)) ?? 0,
      payAmount: parseNumber(String(data.payAmount)) ?? 0,
      leftAmount: parseNumber(String(data.leftAmount)) ?? 0,
      created_at: data.created_at ?? new Date(),
      updated_at: new Date(),
      attachments: []
    };

    if (attachments.length > 0) {
      await SupplierImageService.addImage(newSupplier.supplierId, attachments);
    }
    setOpen(false);
    onCreated?.(newSupplier);
  };

  const editSubmit = async (data: Supplier) => {
    data.amount = parseNumber(String(data.amount)) ?? 0;
    data.quantity = parseNumber(String(data.quantity)) ?? 0;
    data.payAmount = parseNumber(String(data.payAmount)) ?? 0;
    data.leftAmount = parseNumber(String(data.leftAmount)) ?? 0;
    data.updated_at = new Date();
    data.attachments = [];
    // data.attachments = attachments;
    if (attachments.length > 0) {
      await SupplierImageService.addImage(editSupplier!.supplierId, attachments);
    }
    setOpen(false);
    onEdited?.(data);
  };

  const resetForm = () => {
    setAttachments([]);
    supplierForm.reset({
      name: "",
      attachments: [],
      updated_at: new Date(),
      created_at: new Date(),
      note: "",
      phoneOne: "",
      itemName: "",
      amount: 0,
      quantity: 0,
      payAmount: 0,
      leftAmount: 0,
      supplierId: ""
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
          <Form {...supplierForm}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                return supplierForm.handleSubmit(submit)();
              }}
              className="space-y-3"
            >
              {editSupplier && (
                <FormField
                  name="supplierId"
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
                rules={{ required: "Supplier name is required" }}
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
                name="itemName"
                rules={{ required: "Item Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field}></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="amount"
                rules={{ required: "Amount is required" }}
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
              <FormField
                name="quantity"
                rules={{ required: "Quantity is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input {...field} type="number"></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="payAmount"
                rules={{ required: "Pay Amount is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number"></Input>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                name="leftAmount"
                rules={{ required: "Left Amount is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number"></Input>
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
                        title={supplierForm.watch("name") ?? "Attachment"}
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
                Created {supplierForm.watch("created_at", new Date()).toDateString()} - Updated{" "}
                {supplierForm.watch("updated_at", new Date()).toDateString()}
              </p>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => supplierForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupplierDeleteDialog({
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

export function SupplierDetailDialog({
  supplier,
  children
}: {
  supplier: Supplier;
  children: React.ReactNode;
}) {
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const data = await SupplierImageService.getImage(supplier.supplierId);
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
          <DialogTitle>{supplier.name}</DialogTitle>
          <DialogDescription>{supplier.note}</DialogDescription>
        </DialogHeader>
        <p className="text-sm my-0">Phone 1 - {supplier.phoneOne}</p>
        <p className="text-sm my-0">Phone 2 - {supplier.phoneTwo}</p>
        <p className="text-sm my-0">
          Created Date - {moment(supplier.created_at).format("hh:mm:ss MMM d y")}
        </p>
        <p className="text-sm my-0">
          Updated Date - {moment(supplier.updated_at).format("hh:mm:ss MMM d y")}
        </p>
        <p className="text-sm my-0">ID - {supplier.supplierId}</p>

        <div className="flex gap-x-5 mt-3 overflow-x-scroll py-3">
          {attachments &&
            attachments.map((imageData, index) => (
              <span key={index} className="relative min-w-fit">
                <Base64ImageViewer title={supplier.name} base64String={imageData}>
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
