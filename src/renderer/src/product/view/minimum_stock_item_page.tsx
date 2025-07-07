import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Item } from "../interface/item";
import ItemService from "../service/item_service";
import {
  chunkArray,
  convertToTitleCase,
  paginator,
  parseNumber
} from "@renderer/utils/general_utils";
import { Category } from "../interface/category";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, RefreshCcw } from "lucide-react";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import LoadingWidget from "@renderer/app/view/components/loading";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { ItemDeleteDialog, ItemDialog } from "./item_list_page";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import CategoryService from "../service/category_service";
import moment from "moment";
export function MinimumStockItemsPage() {
  const [quantity, setQuantity] = useState(
    () => parseNumber(localStorage.getItem("minimumStockQuantity") ?? "") ?? 25
  );
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginateIndex, setPanigateIndex] = useState(0);
  const [query, setQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(function () {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    const categoryData = await CategoryService.getCategories();
    setProducts(data);
    setCategories(categoryData);
    setLoading(false);
  };

  const filterItems = (origin: Item[]) => {
    const queryFiltered = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) || element.item_id.includes(query)
    );

    const categoryFiltered = selectedCategory
      ? queryFiltered.filter((e) => e.category_id === selectedCategory)
      : queryFiltered;

    const stockFiltered = categoryFiltered.filter((e) => e.useStock && e.stock < quantity);
    stockFiltered.sort((a, b) => a.stock - b.stock);
    return stockFiltered;
  };

  const filteredItems = filterItems(products);
  const paginatedData = paginator(filteredItems, paginateIndex, 10);

  return (
    <div className="p-5">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Dashboard", route: "/dashboard" },
          { name: "Minimum Stock Items", route: "/dashboard/minimum-stock-items" }
        ]}
      />
      <div className="flex justify-between items-center">
        <p className="text-lg">Minimum Stock Items</p>
        <div className="flex gap-x-3">
          <Button
            variant={"ghost"}
            className="w-[40px] px-2"
            onClick={() => {
              if (!loading) {
                fetchProducts();
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
          <ValueInputDialog
            title="Minimim Stock Qantity"
            description="Enter quantity"
            actionTitle="Save"
            onSubmit={(value) => {
              if (value) {
                const quantity = parseNumber(value);
                localStorage.setItem("minimumStockQuantity", JSON.stringify(quantity ?? 25));
                setQuantity(quantity ?? 25);
              }
            }}
          >
            <Button>Less {quantity}</Button>
          </ValueInputDialog>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {selectedCategory
                  ? categories.find((e) => e.category_id === selectedCategory)?.name ?? "Category"
                  : "Category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category, index) => {
                return (
                  <SelectItem key={index} value={category.category_id}>
                    {category.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedCategory && (
            <Button variant={"outline"} onClick={() => setSelectedCategory(null)}>
              Refresh
            </Button>
          )}
        </div>
      </div>
      {loading && <LoadingWidget />}
      {!loading && (
        <div className="border rounded-md mt-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="pl-5 rounded-md">No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Edited Date</TableHead>
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
                paginatedData.map((item, index) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="pl-5">{index + 1 + 10 * paginateIndex}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.purchasedPrice}</TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell>{item.unitPrice - item.purchasedPrice}</TableCell>
                    <TableCell className="text-red-500">{item.stock}</TableCell>
                    <TableCell>{moment(item.editedDate).format("hh:mm DD/MM/y")}</TableCell>

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
                                await fetchProducts();
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
                                fetchProducts();
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
