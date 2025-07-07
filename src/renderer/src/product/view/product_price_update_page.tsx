import BreadcrumbContext, {
  BreadcrumbRoute
} from "@renderer/app/view/components/breadcrumb_context";
import { useRouteContext } from "@renderer/router";
import { useEffect, useState } from "react";
import { Item } from "../interface/item";
import ItemService from "../service/item_service";
import { chunkArray, paginator, parseNumber } from "@renderer/utils/general_utils";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import { ChevronLeft, ChevronRight, Info, MoreHorizontal, RefreshCcw } from "lucide-react";
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
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@renderer/assets/shadcn/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/assets/shadcn/components/ui/select";
import CategoryService from "../service/category_service";

export default function ProductPriceUpdatePage() {
  const { push } = useRouteContext();
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [paginateIndex, setPanigateIndex] = useState(0);

  const [selectedIDs, setSelectedID] = useState<string[]>([]);

  const [isPercentUpdate, setIsPercentUpdate] = useState(false);
  const [updateValue, setUpdateValue] = useState(0);

  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(function () {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const data = await ItemService.getItems();
    const categoryData = await CategoryService.getCategories();
    data.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
    setProducts(data);
    setCategories(categoryData);
    setLoading(false);
  };

  const updatePrice = async () => {
    setUpdating(true);
    const selectedProducts = products.filter((e) => selectedIDs.includes(e.item_id));
    let finishedCount = 0;
    for (const product of selectedProducts) {
      const udpatedPrice = isPercentUpdate
        ? Math.round(product.unitPrice * (updateValue / 100))
        : updateValue;
      product.unitPrice = udpatedPrice;
      await ItemService.updateItem(product);
      finishedCount++;
      setProgress(Math.round((finishedCount / selectedProducts.length) * 100));
    }
    setSelectedID([]);
    setUpdateValue(0);
    setUpdating(false);
    toast({ title: "Successfully Updated Price", duration: 1000 });
  };

  const filterItems = (origin: Item[]) => {
    let data = origin.filter(
      (element) =>
        element.name.toLowerCase().includes(query.toLowerCase()) || element.item_id.includes(query)
    );
    data = selectedCategory ? data.filter((e) => e.category_id === selectedCategory) : data;

    return data;
  };

  const filteredItems = filterItems(products ?? []);
  const paginatedData = paginator(filteredItems, paginateIndex, 10);

  return (
    <div className="p-5 w-full">
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Setting", route: "/settings" },
          { name: "Product Menu", route: "/settings/product-menu" },
          { name: "Price Update", route: "/settings/product-menu/update-price" }
        ]}
      />
      <Tabs
        defaultValue="amount"
        onValueChange={(value) => {
          setIsPercentUpdate(value === "percentage");
        }}
      >
        <div className="flex justify-between items-center">
          <p className="text-lg">Product Price Update</p>
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

            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="amount">Amount</TabsTrigger>
              <TabsTrigger value="percentage">Pecentage</TabsTrigger>
            </TabsList>

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
        <div className="w-full flex flex-row items-center gap-3">
          <TabsContent value="amount">
            <Input
              placeholder="Enter Price"
              className="w-[200px] mb-2"
              type="number"
              onChange={(event) => {
                setUpdateValue(parseNumber(event.target.value) ?? 0);
              }}
              value={updateValue}
            ></Input>
          </TabsContent>
          <TabsContent value="percentage">
            <Input
              placeholder="Enter Percentage"
              className="w-[200px] mb-2"
              type="number"
              onChange={(event) => setUpdateValue(parseNumber(event.target.value) ?? 0)}
              value={updateValue}
            ></Input>
          </TabsContent>
          <Button
            variant={updating ? "outline" : "default"}
            className={updating ? "text-primary" : ""}
            onClick={() => {
              if (updating) {
                toast({ title: "Please wait current updating finish" });
                return;
              } else {
                updatePrice();
              }
            }}
          >
            {updating ? `Updating ${progress}%` : `Update Price`}
          </Button>
        </div>
      </Tabs>

      <AnimatePresence>
        {isPercentUpdate ? (
          <motion.div
            key="percentageInfo"
            className="mt-2"
            initial={{
              x: -100,
              opacity: 0
            }}
            animate={{
              x: 0,
              opacity: 1
            }}
            exit={{
              x: -100,
              opacity: 0
            }}
          >
            <div className="flex flex-row items-center gap-1">
              <Info className="size-4 text-slate-500 inline" />
              <p className="text-sm">
                Updating by precentage is a kind of updating the{" "}
                <span className="font-semibold">percentage of product current sale price</span>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="amountInformation"
            className="mt-2"
            initial={{
              x: -100,
              opacity: 0
            }}
            animate={{
              x: 0,
              opacity: 1
            }}
            exit={{
              x: -100,
              opacity: 0
            }}
          >
            <div className="flex flex-row items-center gap-1">
              <Info className="size-4 text-slate-500 inline" />
              <p className="text-sm">
                Updating by amount is a kind of updating the
                <span className="font-semibold"> value of product sale price</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <TableHead className="font-semibold text-primary">Updated Sale (~)</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Total Purchased</TableHead>
                <TableHead>Total Sale</TableHead>
                <TableHead>Total Profit</TableHead>
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
                    {/* <TableCell className="pl-5">{index + 1 + 10 * paginateIndex}</TableCell> */}
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
                    <TableCell>
                      {selectedIDs.includes(item.item_id)
                        ? isPercentUpdate
                          ? Math.round(item.unitPrice * (updateValue / 100))
                          : updateValue
                        : item.unitPrice}
                    </TableCell>
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
