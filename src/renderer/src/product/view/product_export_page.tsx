import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { useRouteContext } from "@renderer/router";
import { chunkArray, paginator } from "@renderer/utils/general_utils";
import { useEffect, useState } from "react";
import { Item } from "../interface/item";
import ItemService from "../service/item_service";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
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
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { ItemDeleteDialog, ItemDialog } from "./item_list_page";
import { exportProductExcel } from "../utility/product_excel_utils";
import CategoryService from "../service/category_service";
import UnitService from "../service/unit_service";
import moment from "moment";

export function ProductExportScreen() {
  const { push } = useRouteContext();
  const [products, setProducts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [selectedIDs, setSelectedID] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(function () {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    data.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
    setProducts(data);
    setSelectedID(data.map((e) => e.item_id));
    setLoading(false);
  };

  const exportProducts = async () => {
    if (selectedIDs.length === 0 || products.length === 0) {
      toast({
        title: `No item to export`
      });
      return;
    }

    setExporting(true);
    const selectedProducts = products.filter((e) => selectedIDs.includes(e.item_id));

    const categories = await CategoryService.getCategories();
    const units = await UnitService.getUnits();

    await exportProductExcel(
      `Item Export ${new Date().getMilliseconds()}.xlsx`,
      selectedProducts,
      categories,
      units,
      "customSave"
    );

    setSelectedID([]);
    setExporting(false);
  };

  const filterItems = (origin: Item[]) => {
    return origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) || element.item_id.includes(query)
    );
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
          { name: "Product Export", route: "/settings/product-menu/export-products" }
        ]}
      />

      <div className="flex justify-between items-center">
        <p className="text-lg">Product Export</p>
        <div className="flex gap-x-3">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
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
            placeholder="Search"
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          ></Input>

          <Button
            variant={exporting ? "outline" : "default"}
            className={exporting ? "text-primary" : ""}
            onClick={() => {
              if (exporting) {
                toast({ title: "Please wait current updating finish" });
                return;
              } else {
                exportProducts();
              }
            }}
          >
            {exporting ? `Exporting` : `Export`}
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
                <TableHead className="rounded--tr-md"></TableHead>
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
                                await ItemService.updateItem(item);
                                toast({
                                  title: `Successfully updated to ${item.name}`
                                });
                                await fetchItems();
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
                                await ItemService.deleteItem(item.item_id);
                                fetchItems();
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
