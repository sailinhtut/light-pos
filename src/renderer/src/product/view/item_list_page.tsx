import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import React, { useContext, useEffect, useState } from "react";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cross,
  Delete,
  MoreHorizontal,
  Plus,
  PlusIcon,
  RefreshCcw,
  Trash,
  Trash2,
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
  paginator,
  parseNumber,
  purifiedNumber,
  sleep,
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

import { FieldValue, FieldValues, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@renderer/assets/shadcn/components/ui/form";

import { Textarea } from "@renderer/assets/shadcn/components/ui/textarea";
import { FileImage } from "@renderer/app/view/components/file_image";
import { appName } from "@renderer/utils/app_constants";
import ItemService from "../service/item_service";
import { Item, ItemInterface } from "../interface/item";
import { Category } from "../interface/category";
import { Unit } from "../interface/unit";
import { useRouteContext } from "@renderer/router";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import CategoryService from "../service/category_service";
import UnitService from "../service/unit_service";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import { SelectLabel } from "@radix-ui/react-select";
import { Switch } from "@renderer/assets/shadcn/components/ui/switch";
import { Calendar } from "@renderer/assets/shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";

import { CategoryDialog } from "./category_list_page";
import { UnitDialog } from "./unit_list_page";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import { CartContext } from "@renderer/order/context/cart_context";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { motion } from "framer-motion";
import { ShopContext } from "../context/shop_context";
import ItemImageService from "../service/item_image_local_service";
import { browserReadFileBytes } from "@renderer/utils/file_utils";
import { arrayBufferToBase64 } from "@renderer/utils/encrypt_utils";
import { useTranslation } from "react-i18next";
import { AppRoles } from "@renderer/auth/interface/roles";
import { Base64ImageViewer } from "@renderer/app/view/components/image_viewer";
import { AppContext } from "@renderer/app/context/app_context";

export default function ItemListPage() {
  const [_items, setItems] = useState<Item[]>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const { units } = useContext(ShopContext);

  const shopContext = useContext(ShopContext);

  useEffect(function () {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    data.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
    setItems(data);
    setLoading(false);
  };

  const filterItems = (origin: Item[]) => {
    return origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        element.item_id.includes(query) ||
        String(element.barcode) === query
    );
  };

  const filteredItems = filterItems(_items ?? []);
  const paginatedData = paginator(filteredItems, paginateIndex, 10);

  return (
    <div className="p-5 w-[calc(100vw-180px)]">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Product List", route: "/settings/product-menu/product-list" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Product List</p>
        <div className="flex">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2 "
            onClick={() => {
              if (!loading) {
                fetchItems();
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
          <ItemDialog
            title="Add Item"
            actionTitle="Add"
            onCreated={async (item) => {
              setLoading(true);
              await ItemService.addItem(item);
              await fetchItems();
              sleep(2);
              await shopContext.fetchData();
            }}
          >
            <Button className="mx-3">Add Item</Button>
          </ItemDialog>
          <motion.div
            initial={{
              x: "-100%",
              opacity: 0,
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
              title="Delete Items"
              description="Are you sure to delete all selected items ?"
              actionTitle="Confirm"
              onConfirm={async () => {
                setLoading(true);
                const lastest = await ItemService.getItems();
                const removed = lastest.filter((e) => !selectedIDs.includes(e.item_id));
                await ItemService.saveItems(removed);
                toast({
                  title: `Successfully Deleted`
                });
                setSelectedID([]);
                setLoading(false);
                await fetchItems();
                sleep(2);
                await shopContext.fetchData();
              }}
            >
              <Button variant={"destructive"} size={"icon"}>
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
              <TableRow className="bg-primary/5">
                <TableHead className="rounded-tl-md">
                  <Checkbox
                    className="border-slate-500 shadow-none ml-2 "
                    checked={selectedIDs.length === filteredItems.length && selectedIDs.length > 0}
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredItems.map((e) => e.item_id));
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
                <TableHead>Purchased</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Total Purchased</TableHead>
                <TableHead>Total Sale</TableHead>
                <TableHead>Total Profit</TableHead>
                {/* <TableHead>Detail</TableHead> */}
                <TableHead className="rounded-tr-md"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedData && (
                <TableRow>
                  <TableCell colSpan={10} className="pl-5 text-slate-500">
                    No Data
                  </TableCell>
                </TableRow>
              )}
              {paginatedData &&
                paginatedData.map((item, index) => (
                  <ItemDetailDialog item={item} units={units}>
                    <TableRow key={item.item_id} onClick={(event) => event.stopPropagation()}>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          className="border-slate-500 shadow-none ml-2"
                          checked={selectedIDs.includes(item.item_id)}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedID([item.item_id, ...selectedIDs]);
                            } else {
                              setSelectedID(selectedIDs.filter((e) => e !== item.item_id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.purchasedPrice}</TableCell>
                      <TableCell>{item.unitPrice}</TableCell>
                      <TableCell>{item.unitPrice - item.purchasedPrice}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{item.purchasedPrice * item.stock}</TableCell>
                      <TableCell>{item.unitPrice * item.stock}</TableCell>
                      <TableCell>{(item.unitPrice - item.purchasedPrice) * item.stock}</TableCell>
                      {/* <ItemDetailDialog item={item} units={units}>
                        <TableCell
                          className="text-primary text-sm cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          View Detail
                        </TableCell>
                      </ItemDetailDialog> */}
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
                            }}
                          >
                            <DropdownMenuGroup>
                              <ItemDialog
                                title="Edit Item"
                                actionTitle="Save"
                                editItem={item}
                                onEdited={async (item) => {
                                  setLoading(true);
                                  await ItemService.updateItem(item);
                                  toast({
                                    title: `Successfully updated ${item.name}`
                                  });
                                  await fetchItems();
                                  sleep(2);
                                  await shopContext.fetchData();
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
                              </ItemDialog>

                              <ItemDialog
                                title="Clone Item"
                                actionTitle="Save"
                                cloneToEditedItem={true}
                                editItem={{ ...item, item_id: uniqueId() }}
                                onCloned={async (cloned) => {
                                  setLoading(true);
                                  setLoading(true);
                                  await ItemService.addItem(cloned);
                                  toast({
                                    title: `Successfully cloned to ${cloned.name}`
                                  });
                                  await fetchItems();
                                  sleep(2);
                                  await shopContext.fetchData();
                                }}
                              >
                                <DropdownMenuItem
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                >
                                  Clone
                                </DropdownMenuItem>
                              </ItemDialog>

                              <ItemDeleteDialog
                                onConfirmed={async () => {
                                  setLoading(true);
                                  await ItemService.deleteItem(item.item_id);
                                  await fetchItems();

                                  sleep(2);
                                  await shopContext.fetchData();
                                }}
                                title="Delete Item"
                                description={`Are you sure to delete ${item.name} ?`}
                                actionTitle="Confirm"
                              >
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </ItemDeleteDialog>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </ItemDetailDialog>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-3 py-2 border-t ">
            <p className="text-sm">Total {filteredItems.length}</p>
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
                {paginateIndex + 1} - {chunkArray(filteredItems, 10).length}
              </span>

              <Button
                className="px-1 h-7"
                variant={"outline"}
                onClick={() => {
                  const chunks = chunkArray(filteredItems, 10);
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

export function ItemDialog({
  onCreated,
  onEdited,
  onCloned,
  cloneToEditedItem = false,
  editItem,
  title,
  description,
  actionTitle,
  children
}: {
  onCreated?: (item: Item) => void;
  onEdited?: (item: Item) => void;
  onCloned?: (item: Item) => void;
  cloneToEditedItem?: boolean;
  editItem?: Item;
  children?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle: string;
}) {
  const itemForm = useForm<Item>();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Please wait while getting categories and units");

  const [imageData, setImageData] = useState<string | undefined>(undefined);

  useEffect(function () {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const categoryData = await CategoryService.getCategories();
    const unitData = await UnitService.getUnits();
    const itemData = await ItemService.getItems();

    setCategories(categoryData);
    setUnits(unitData);
    setItems(itemData);
    setLoading(false);
  };

  // "item_id": "fi0893w55u0ext", done
  // "name": "test barcode", done
  // "description": "", done
  // "category_id": "pj81", done
  // "unitNameId": "tgxs", done
  // "purchasedPrice": 100, done
  // "unitAmount": 1, !!!!
  // "unitPrice": 150, done
  // "unitPriceVariants": [],
  // "useStock": true , done
  // "stock": 8, done
  // "barcode": "8851717040351", done
  // "editedDate": "2024-06-14T22:24:51.998620",
  // "pinned": false, !!!!
  // "pinnedTime": "2024-06-14T22:00:53.170865" !!!!

  useEffect(function () {
    if (editItem) {
      itemForm.setValue("item_id", editItem.item_id);
      itemForm.setValue("name", editItem.name);
      itemForm.setValue("description", editItem.description);
      itemForm.setValue("category_id", editItem.category_id);
      itemForm.setValue("barcode", editItem.barcode);
      itemForm.setValue("pinned", editItem.pinned);
      itemForm.setValue("pinnedTime", editItem.pinnedTime);
      itemForm.setValue("unitNameId", editItem.unitNameId);
      itemForm.setValue("itemImage", editItem.itemImage);
      itemForm.setValue("editedDate", editItem.editedDate);
      itemForm.setValue("stock", editItem.stock);
      itemForm.setValue("unitPrice", editItem.unitPrice);
      itemForm.setValue("unitAmount", editItem.unitAmount);
      itemForm.setValue("purchasedPrice", editItem.purchasedPrice);
      itemForm.setValue("expiredDate", editItem.expiredDate);
      itemForm.setValue("useStock", editItem.useStock);
      itemForm.setValue("unitPriceVariants", editItem.unitPriceVariants);
      loadImage();
    }
  }, []);

  const loadImage = async () => {
    const image = await ItemImageService.getImage(editItem!.item_id);
    setImageData(image);
  };

  const barcodeExisted = (barcode: string | null, currentItemId?: string): boolean => {
    if (barcode === undefined || barcode === null || String(barcode).trim().length === 0)
      return false;
    const matched = items.find((e) =>
      currentItemId
        ? String(e.barcode) === barcode && e.item_id !== currentItemId
        : String(e.barcode) === barcode
    );

    if (matched) {
      toast({
        title: `Barcoded is already used in ${matched!.name}`,
        duration: 1000
      });
    }

    return matched !== undefined;
  };

  const submit = (data: Item) => {
    if (editItem) {
      editSubmit(data);
    } else {
      createSubmit(data);
    }
  };

  const cartContext = useContext(CartContext);

  const checkCartItem = () => {
    if (cartContext.getTotalItem() > 0) {
      toast({ title: "Please clear cart to modify item" });
      return false;
    }
    return true;
  };

  const createSubmit = async (data: Item) => {
    if (!checkCartItem()) return;

    if (barcodeExisted(data.barcode)) return;

    const newItem: ItemInterface = {
      item_id: uniqueId(),
      itemImage: null,
      name: data.name,
      description: data.description,
      category_id: data.category_id,
      unitNameId: data.unitNameId,
      purchasedPrice: data.purchasedPrice,
      unitAmount: 1,
      unitPrice: data.unitPrice,
      unitPriceVariants: data.unitPriceVariants ?? [],
      useStock: data.useStock,
      stock: data.stock ?? 0,
      barcode: data.barcode,
      editedDate: data.editedDate,
      expiredDate: data.expiredDate,
      pinned: false,
      pinnedTime: new Date()
    };
    newItem.unitPriceVariants = [];
    newItem.stock = parseNumber(String(newItem.stock)) ?? 0;
    newItem.purchasedPrice = parseNumber(String(newItem.purchasedPrice)) ?? 0;
    newItem.unitAmount = parseNumber(String(newItem.unitAmount)) ?? 0;
    newItem.unitPrice = parseNumber(String(newItem.unitPrice)) ?? 0;

    if (imageData) {
      ItemImageService.addImage(newItem.item_id, imageData);
    }

    setOpen(false);
    onCreated?.(newItem);
    resetForm();
  };

  const editSubmit = async (data: Item) => {
    if (!checkCartItem()) return;

    // if (barcodeExisted(data.barcode, editItem!.item_id)) return;

    setOpen(false);
    data.stock = parseNumber(String(data.stock)) ?? 0;
    data.purchasedPrice = parseNumber(String(data.purchasedPrice)) ?? 0;
    data.unitAmount = parseNumber(String(data.unitAmount)) ?? 0;
    data.unitPrice = parseNumber(String(data.unitPrice)) ?? 0;

    if (imageData) {
      await ItemImageService.addImage(editItem!.item_id, imageData);
    }

    if (cloneToEditedItem) {
      onCloned?.(data);
    } else {
      onEdited?.(data);
    }
    resetForm();
  };

  const resetForm = () => {
    itemForm.reset({
      item_id: "",
      name: "",
      description: "",
      category_id: "",
      barcode: "",
      pinned: false,
      pinnedTime: new Date(),
      unitNameId: "",
      itemImage: null,
      editedDate: new Date(),
      stock: 0,
      unitPrice: 0,
      unitAmount: 1,
      purchasedPrice: 0,
      expiredDate: new Date(),
      useStock: true,
      unitPriceVariants: []
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
        {loading && (
          <div className="flex flex-col gap-y-3">
            <LoadingWidget />
            <p>{loadingText}</p>
          </div>
        )}

        {!loading && (
          <div>
            {imageData && imageData.length !== 0 && (
              <img
                src={`data:image/png;base64,${imageData}`}
                alt="Item Image"
                className="rounded-lg border mb-3"
              />
            )}

            <div className="flex mt-3 mb-2 flex-row gap-3 items-center">
              <Input
                type="file"
                className="h-[33px]"
                accept="image/png, image/jpeg, image/gif"
                onChange={async (event) => {
                  if (event.target.files) {
                    const selectedFile = event.target.files[0];
                    const bytes = await browserReadFileBytes(selectedFile);
                    const base64String = arrayBufferToBase64(bytes);
                    setImageData(base64String);
                  }
                }}
              />
              {imageData && (
                <Button
                  size="sm"
                  onClick={async (event) => {
                    setImageData(undefined);
                    if (editItem) {
                      await ItemImageService.deleteImage(editItem!.item_id);
                    }
                  }}
                >
                  Remove Image
                </Button>
              )}
            </div>

            <Form {...itemForm}>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  return itemForm.handleSubmit(submit)();
                }}
                className="space-y-3"
              >
                {editItem && (
                  <FormField
                    name="item_id"
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
                  rules={{ required: "Name is required" }}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decription</FormLabel>
                      <FormControl>
                        <Textarea {...field}></Textarea>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="category_id"
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-x-3">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose">
                                {categories.find((e) => e.category_id === field.value)?.name ??
                                  "Choose"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel className="p-1">Choose Category</SelectLabel>
                                {categories &&
                                  categories.map((category, index) => (
                                    <SelectItem key={index} value={category.category_id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <CategoryDialog
                            title="Create New Category"
                            description=""
                            actionTitle="Create"
                            onCreated={async (category) => {
                              setLoading(true);
                              setLoadingText(`Creating ${category.name} category ...`);
                              await CategoryService.addCategory(category);
                              await loadConfigs();
                              itemForm.setValue("category_id", category.category_id);
                            }}
                          >
                            <Button variant={"outline"} className="px-2" size={"icon"}>
                              <Plus />
                            </Button>
                          </CategoryDialog>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="unitNameId"
                  rules={{ required: "Unit is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-x-3">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose">
                                {units.find((e) => e.unitId === field.value)?.unitName ?? "Choose"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel className="p-1">Choose Unit</SelectLabel>
                                {units &&
                                  units.map((unit, index) => (
                                    <SelectItem key={index} value={unit.unitId}>
                                      {unit.unitName}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <UnitDialog
                            title="Create New Unit"
                            description=""
                            allUnits={units}
                            actionTitle="Create"
                            onCreated={async (unit) => {
                              setLoading(true);
                              setLoadingText(`Creating ${unit.unitName} unit ...`);
                              await UnitService.addUnit(unit);
                              await loadConfigs();
                              itemForm.setValue("unitNameId", unit.unitId);
                            }}
                          >
                            <Button variant={"outline"} className="px-2" size={"icon"}>
                              <Plus />
                            </Button>
                          </UnitDialog>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="purchasedPrice"
                  rules={{ required: "Purchased price is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchased Price is required</FormLabel>
                      <FormControl>
                        <Input {...field} type="number"></Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="unitPrice"
                  rules={{ required: "Sale price is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <FormControl>
                        <Input {...field} type="number"></Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="unitPriceVariants"
                  defaultValue={[]}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex flex-row justify-between items-center ">
                        Price Variant
                        <PriceVariantCreator
                          onCreated={(variant) => {
                            const currentVariants = field.value;
                            if (Array.isArray(currentVariants)) {
                              field.onChange([...currentVariants, variant]);
                            } else {
                              field.onChange([variant]);
                            }
                          }}
                        ></PriceVariantCreator>
                      </FormLabel>

                      <FormControl>
                        <div className="flex flex-wrap flex-row gap-2 items-center">
                          {field.value &&
                            Array.isArray(field.value) &&
                            field.value.length === 0 && (
                              <p className="text-sm text-slate-500">No Varaint</p>
                            )}
                          {field.value &&
                            Array.isArray(field.value) &&
                            field.value.length > 0 &&
                            field.value.map((variant) => (
                              <div className="px-2 py-1 shadow rounded-md text-sm  bg-card flex flex-row border items-center select-none cursor-auto ">
                                {variant["name"] ?? ""} (&gt;{variant["quantity"]}) -{" "}
                                {variant["price"]}
                                <ConfirmDialog
                                  actionVariant={"destructive"}
                                  title="Delete Variant Price"
                                  description={`Are you sure to delete ${variant["name"] ?? ""}?`}
                                  actionTitle="Delete"
                                  onConfirm={() => {
                                    const currentVariants = field.value;
                                    if (Array.isArray(currentVariants)) {
                                      field.onChange(
                                        currentVariants.filter((e) => e.name !== variant["name"])
                                      );
                                    }
                                  }}
                                >
                                  <Trash2 className="size-4 text-destructive ml-3 hover:text-foreground" />
                                </ConfirmDialog>
                              </div>
                            ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="useStock"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center">
                      <FormLabel>Use Stock</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <motion.div
                  animate={{
                    height: itemForm.watch("useStock", false) ? "auto" : 0,
                    scaleY: itemForm.watch("useStock", false) ? 1 : 0
                  }}
                  initial={{
                    height: 0,
                    scaleY: 0
                  }}
                >
                  <FormField
                    defaultValue={0}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input {...field} type="number"></Input>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  ></FormField>
                </motion.div>
                <FormField
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bar Code</FormLabel>
                      <FormControl>
                        <Input {...field}></Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="expiredDate"
                  defaultValue={undefined}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expired Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger className="block" asChild>
                            <Button variant={"outline"} className="flex items-center">
                              <CalendarIcon className="size-5 mr-3 text-slate-500 " />
                              {field.value
                                ? (field.value as Date).toDateString()
                                : "Set Expired Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                <FormField
                  name="editedDate"
                  defaultValue={new Date()}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edited Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger className="block" asChild>
                            <Button variant={"outline"} className="flex items-center">
                              <CalendarIcon className="size-5 mr-3 text-slate-500 " />
                              {(field.value as Date).toDateString()}{" "}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              </form>
            </Form>
          </div>
        )}
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button onClick={() => itemForm.handleSubmit(submit)()}>{actionTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItemDeleteDialog({
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

function PriceVariantCreator({ onCreated }: { onCreated(variant): void }) {
  const priceVariantForm = useForm<{ name: string; quantity: number; price: number }>();
  const [open, setOpen] = useState(false);

  const submit = (data: FieldValues) => {
    setOpen(false);
    data.quantity = parseNumber(data.quantity) ?? 0;
    data.price = parseNumber(data.price) ?? 0;
    onCreated(data);
    priceVariantForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <PlusIcon className="transition-all duration-300  active:scale-90" />
      </DialogTrigger>
      <DialogContent>
        <Form {...priceVariantForm}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return priceVariantForm.handleSubmit(submit)();
            }}
          >
            <DialogHeader>
              <DialogTitle>Create Price Variant</DialogTitle>
            </DialogHeader>
            <FormField
              name="name"
              rules={{
                required: "Name is requried"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field}></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <FormField
              name="quantity"
              rules={{
                required: "Quantity is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>

            <FormField
              name="price"
              rules={{
                required: "Price is requried",
                validate: (value) => !isNaN(value) || "Invalid Number"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input {...field} type="number"></Input>
                  </FormControl>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            ></FormField>
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ItemDetailDialog({
  item,
  children,
  units
}: {
  children: React.ReactNode;
  units: Unit[];
  item: Item;
}) {
  const [open, setOpen] = useState(false);
  const { currency, minimumStockColor, minimumStockQuantity } = useContext(AppContext);

  const { t } = useTranslation();

  const selectedUnit = units.find((e) => e.unitId === item.unitNameId);

  const [imageData, setImageData] = useState<string | undefined>(undefined);

  useEffect(
    function () {
      loadImage();
    },
    [item]
  );

  const loadImage = async () => {
    const image = await ItemImageService.getImage(item.item_id);
    setImageData(image);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        hideCloseButton={true}
        className="max-h-[80vh] overflow-y-auto"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogHeader>
          {imageData && (
            <Base64ImageViewer title={item.name} base64String={imageData}>
              <img
                src={`data:image/png;base64,${imageData}`}
                alt="Item Image"
                className="rounded-lg border mb-3"
              />
            </Base64ImageViewer>
          )}
          <DialogTitle className="w-full flex flex-row justify-between items-center ">
            <span className="flex flex-row items-center">{item.name}</span>
          </DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>

        <div className="pb-5 flex flex-col gap-3">
          <p className="text-sm">
            Purchased Price - {item.purchasedPrice} {currency}
          </p>
          <p className="text-sm">
            Sale Price - {item.unitPrice} {currency}
          </p>

          <div className="w-full flex flex-row justify-between items-center">
            <p className="text-sm">
              <p
                style={{
                  color: item.useStock && item.stock < minimumStockQuantity ? minimumStockColor : ""
                }}
              >
                Stock - {item.stock} {selectedUnit?.unitName ?? ""}
              </p>
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"sm"}
                  className="h-6 text-xs text-primary cursor-pointer"
                >
                  See Unit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{item.name}'s Unit Convertion</DialogTitle>
                </DialogHeader>
                <div>
                  {selectedUnit &&
                    selectedUnit.convertion !== null &&
                    Object.keys(selectedUnit.convertion).map((relatedUnitKey) => {
                      const relatedUnitObject = units.find((e) => e.unitId === relatedUnitKey);
                      const relatedUnitValue = selectedUnit.convertion![relatedUnitKey];
                      const revert = String(relatedUnitValue).includes("parentUnit");
                      const revertCount =
                        String(relatedUnitValue).split("-")[
                          String(relatedUnitValue).split("-").length - 1
                        ];
                      const revertCountNumber = parseNumber(revertCount) ?? 0;
                      const resolvedUnitValue = revert
                        ? item.stock / revertCountNumber
                        : item.stock * revertCountNumber;

                      return (
                        <p>
                          In {relatedUnitObject?.unitName ?? relatedUnitKey} -{" "}
                          {purifiedNumber(resolvedUnitValue)}
                        </p>
                      );
                    })}
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-sm">
            Unit Profit - {formatNumberWithCommas(item.unitPrice - item.purchasedPrice)} {currency}
          </p>

          {item.useStock && (
            <p className="text-sm">
              Total Purchased Amount - {formatNumberWithCommas(item.purchasedPrice * item.stock)}{" "}
              {currency}
            </p>
          )}

          <p className="text-sm">
            Total Sale Amount - {formatNumberWithCommas(item.unitPrice * item.stock)} {currency}
          </p>

          {item.useStock && (
            <p className="text-sm">
              Total Profit -{" "}
              {formatNumberWithCommas((item.unitPrice - item.purchasedPrice) * item.stock)}{" "}
              {currency}
            </p>
          )}
        </div>
        <DialogFooter className="items-center gap-2">
          <DialogClose asChild>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
