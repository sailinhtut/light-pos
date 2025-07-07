import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { chunkArray, paginator, sleep, uniqueId } from "@renderer/utils/general_utils";
import { Item } from "../interface/item";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import ItemService from "../service/item_service";
import { useContext, useEffect, useState } from "react";
import { useRouteContext } from "@renderer/router";
import { ChevronLeft, ChevronRight, MoreHorizontal, RefreshCcw } from "lucide-react";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@renderer/assets/shadcn/components/ui/table";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { ItemDeleteDialog, ItemDialog } from "./item_list_page";
import { motion } from "framer-motion";
import { importProductExcel } from "../utility/product_excel_utils";
import { Category } from "../interface/category";
import CategoryService from "../service/category_service";
import UnitService from "../service/unit_service";
import { Unit } from "../interface/unit";
import { ShopContext } from "../context/shop_context";

export function ProductImportScreen() {
  const { push } = useRouteContext();
  const [products, setProducts] = useState<Item[]>([]);

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const shopContext = useContext(ShopContext);

  const importProducts = async () => {
    if (!selectedFile) {
      toast({ title: "Please select file" });
      return;
    }
    setImporting(true);

    const existedItems = await ItemService.getItems();
    const existedCategories = await CategoryService.getCategories();
    const existedUnits = await UnitService.getUnits();

    const pendingToAdd: Item[] = [];
    const selectedProducts = products.filter((e) => selectedIDs.includes(e.item_id));

    for (const product of selectedProducts) {
      // search category and create unless exist
      const searchCategory = categoryFinder(existedCategories, product.category_id);
      if (searchCategory) {
        product.category_id = searchCategory.category_id;
      } else {
        const newCategory = {
          category_id: uniqueId(4),
          name: product.category_id
        };
        await CategoryService.addCategory(newCategory);
        existedCategories.push(newCategory);
        product.category_id = newCategory.category_id;
      }

      // search unit and create unless exist
      const searchUnit = unitFinder(existedUnits, product.unitNameId);
      if (searchUnit) {
        product.unitNameId = searchUnit.unitId;
      } else {
        const newUnit = {
          unitId: uniqueId(4),
          unitName: product.unitNameId,
          convertion: {}
        };
        await UnitService.addUnit(newUnit);
        existedUnits.push(newUnit);
        product.unitNameId = newUnit.unitId;
      }

      const itemExisted =
        product.item_id === "" ? false : existedItems.find((e) => e.item_id === product.item_id);

      if (!itemExisted) {
        product.item_id = uniqueId();
        pendingToAdd.push(product);
      }
    }

    await ItemService.saveItems([...existedItems, ...pendingToAdd]);
    setProducts([]);
    setSelectedID([]);

    toast({ title: "Successfully Imported" });

    setImporting(false);
    sleep(2);
    shopContext.fetchData();
  };

  const filterItems = (origin: Item[]) => {
    return origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) || element.item_id.includes(query)
    );
  };

  const categoryFinder = (
    existedCategories: Category[],
    categoryName: any
  ): Category | undefined => {
    const matched = existedCategories.find((e) => e.name === String(categoryName).trim());
    return matched;
  };

  const unitFinder = (existedUnits: Unit[], unitName: any): Unit | undefined => {
    const matched = existedUnits.find((e) => e.unitName === String(unitName).trim());
    return matched;
  };

  const filteredItems = filterItems(products ?? []);
  const paginatedData = paginator(filteredItems, paginateIndex, 10);

  return (
    <div className="p-5">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Import & Export", route: "/settings/product-menu/product-import-export-menu" },
          { name: "Product Import", route: "/settings/product-menu/import-products" }
        ]}
      />

      <div className="flex justify-between items-center">
        <p className="text-lg">Product Import</p>
        <div className="flex gap-x-3 items-center">
          <Button variant={"ghost"} className="w-[40px] px-2">
            <RefreshCcw
              className={` size-5 text-slate-500 ${loading && "animate-spin transform rotate-180"}`}
            />
          </Button>
          <Input
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>
          <Input
            type="file"
            onChange={async (event) => {
              if (event.target.files && event.target.files[0]) {
                const chosenFile = event.target.files[0];
                setSelectedFile(chosenFile);
                const importData = await importProductExcel(chosenFile);
                importData.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
                setProducts(importData);
                setSelectedID(importData.map((e) => e.item_id));
              }
            }}
            placeholder="Choose Excel File"
          ></Input>

          <Button
            variant={importing ? "outline" : "default"}
            className={importing ? "text-primary" : ""}
            onClick={() => {
              if (importing) {
                toast({ title: "Please wait current updating finish" });
                return;
              } else {
                importProducts();
              }
            }}
          >
            {importing ? `Importing` : `Import`}
          </Button>
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
                      selectedIDs.length !== 0 && selectedIDs.length === filteredItems.length
                    }
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedID(filteredItems.map((e) => e.item_id));
                      } else {
                        setSelectedID([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="flex flex-row items-center">
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
                  <TableRow
                    key={item.item_id}
                    className={`${selectedIDs.includes(item.item_id) && "bg-secondary"}`}
                    onClick={() => {
                      if (!selectedIDs.includes(item.item_id)) {
                        setSelectedID([item.item_id, ...selectedIDs]);
                      } else {
                        setSelectedID(selectedIDs.filter((e) => e !== item.item_id));
                      }
                    }}
                  >
                    <TableCell>
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

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <ItemDialog
                              title="Edit Item"
                              actionTitle="Save"
                              editItem={item}
                              onEdited={async (item) => {
                                setLoading(true);
                                setProducts(
                                  products.map((e) => (e.item_id === item.item_id ? item : e))
                                );
                                toast({
                                  title: `Updated to ${item.name}`
                                });
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
                            </ItemDialog>
                            <ItemDeleteDialog
                              onConfirmed={async () => {
                                setLoading(true);
                                setProducts(products.filter((e) => e.item_id !== item.item_id));
                                toast({
                                  title: `Deleted ${item.name}`
                                });
                                setLoading(false);
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
