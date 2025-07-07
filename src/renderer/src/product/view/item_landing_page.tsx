import FirebaseStorageService from "@renderer/app/service/firebase_storage_service";
import BreadcrumbContext from "@renderer/app/view/components/breadcrumb_context";
import LoadingWidget from "@renderer/app/view/components/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import { appName, customerName, offlineMode } from "@renderer/utils/app_constants";

import { useContext, useEffect, useRef, useState } from "react";
import ItemService from "../service/item_service";
import { Item } from "../interface/item";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Loader,
  Minus,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBasket,
  ShoppingCart,
  SquareMenu,
  WifiOff,
  X
} from "lucide-react";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";

import { Category } from "../interface/category";
import { extractUnitName } from "../utility/product_utils";
import CartPanel from "@renderer/order/view/components/cart_panel";
import { ShopContext, ShopContextProvider } from "../context/shop_context";
import { CartContext } from "@renderer/order/context/cart_context";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { appIcon } from "../../assets/images/app_icon.png";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { DropdownMenuSub, DropdownMenuSubTrigger } from "@radix-ui/react-dropdown-menu";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import {
  formatNumberWithCommas,
  parseNumber,
  purifiedNumber,
  uniqueId
} from "@renderer/utils/general_utils";
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
import { ItemDialog } from "./item_list_page";
import { Table, TableBody, TableCell, TableRow } from "@renderer/assets/shadcn/components/ui/table";
import { Unit } from "../interface/unit";
import { AppContext } from "@renderer/app/context/app_context";
import ItemImageService from "../service/item_image_local_service";
import { useTranslation } from "react-i18next";
import { Base64ImageViewer } from "@renderer/app/view/components/image_viewer";
import CustomerService from "@renderer/customer/service/customer_service";
import OrderActiveService from "@renderer/order/service/order_active_service";
import { Customer } from "@renderer/customer/interface/customer";
import { OrderHistory } from "@renderer/order/interface/order_history";
import CustomCartPanel from "@renderer/order/view/components/custom_cart_panel";
import { truncate } from "original-fs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@renderer/assets/shadcn/components/ui/tooltip";
import OrderActiveLocalService from "@renderer/order/service/order_active_local_service";
import UserContext from "@renderer/auth/context/user_context";
import { AppRoles } from "@renderer/auth/interface/roles";

export default function ItemLandingPage() {
  const { items, categories, units, fetchData, fetching } = useContext(ShopContext);
  const cartContext = useContext(CartContext);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [query, setQuery] = useState("");
  const categoryElement = useRef<HTMLDivElement>(null);
  const [cartCollapse, setCartCollapse] = useState(true);
  const [customCheckOut, setCustomCheckOut] = useState(false);

  const { customCheckOut: enbaleCustomCheckOut } = useContext(AppContext);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderHistory[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    setCartCollapse(localStorage.getItem("cartCollapse") === "collapse");
    fetchActiveOrders();
    fetchCustomers();
  }, [navigator.onLine]);

  const fetchCustomers = async () => {
    const data = await CustomerService.getCustomers();
    setCustomers(data);
  };

  const fetchActiveOrders = async () => {
    const data = offlineMode
      ? await OrderActiveService.getOrderHistories()
      : navigator.onLine
        ? await OrderActiveService.getOrderHistories()
        : await new OrderActiveLocalService().getOrderHistories();
    setActiveOrders(data);
  };

  const filterItems = () => {
    let data: Item[] = items;
    data = items.filter(
      (item) =>
        item.item_id === query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        String(item.barcode) === query
    );
    if (selectedCategory) {
      data = data.filter((item) => item.category_id === selectedCategory!.category_id);
    }
    data.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
    return data;
  };

  return (
    <div className={`p-5`}>
      <BreadcrumbContext
        route={[
          { name: "Light POS", route: "/" },
          { name: "Shop", route: "/" }
        ]}
      />
      <div className="flex justify-between overflow-x-hidden">
        <div className={`${cartCollapse ? "w-[calc(100vw-240px)]" : "w-[calc(100vw-640px)]"} `}>
          {
            <>
              <p className="h-9 text-lg font-semibold flex flex-row items-center w-full justify-between">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <span
                        className="cursor-pointer "
                        onClick={() => {
                          // fetchData();
                          window.location.reload();
                        }}
                      >
                        {customerName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border text-foreground">
                      <p>Reload Data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex flex-row items-center space-x-1">
                  <Button
                    variant={"ghost"}
                    className="w-[40px] px-2"
                    onClick={() => {
                      if (!fetching) {
                        // fetchData();
                        window.location.reload();
                      }
                    }}
                  >
                    <RefreshCcw
                      className={` size-5 text-slate-500 ${fetching && "animate-spin transform rotate-180"}`}
                    />
                  </Button>
                  {/* <Loader
                    className={`size-6 ${fetching && "animate-spin-normal"} ${!fetching && "hidden"} text-primary`}
                  /> */}

                  {!navigator.onLine && !offlineMode && (
                    <Button variant={"ghost"} size={"icon"}>
                      <WifiOff className="size-6" />
                    </Button>
                  )}
                </div>
              </p>
              <div
                className={`${cartCollapse ? "w-[calc(100vw-240px)]" : "w-[calc(100vw-640px)]"} mt-1 flex items-start space-x-3`}
              >
                <div
                  // className="w-[calc(100%-300px)] flex flex-nowrap overflow-auto no-scrollbar pb-2"
                  className="w-[80%] flex flex-nowrap overflow-auto pb-2"
                  ref={categoryElement}
                >
                  <Button
                    variant={!selectedCategory ? "default" : "outline"}
                    className="rounded-full mr-3 h-[40px]"
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    All
                  </Button>
                  {categories &&
                    categories.map((category, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedCategory && selectedCategory.category_id == category.category_id
                            ? "default"
                            : "outline"
                        }
                        className="rounded-full mr-3 h-[40px]"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category.name}
                      </Button>
                    ))}
                </div>

                <div className=" flex gap-x-3 justify-end">
                  {/* <Button
                    size={"icon"}
                    variant={"outline"}
                    className="rounded-full"
                    onClick={() => {
                      if (categoryElement.current) {
                        categoryElement.current.scrollTo({
                          behavior: "smooth",
                          left: categoryElement.current.scrollLeft - 300
                        });
                      }
                    }}
                  >
                    <ChevronLeft className="size-6" />
                  </Button>
                  <Button
                    size={"icon"}
                    variant={"outline"}
                    className="rounded-full"
                    onClick={() => {
                      if (categoryElement.current) {
                        categoryElement.current.scrollTo({
                          behavior: "smooth",
                          left: categoryElement.current.scrollLeft + 300
                        });
                      }
                    }}
                  >
                    <ChevronRight className="size-6" />
                  </Button> */}
                  <Input
                    className="w-[250px] transition-all"
                    placeholder="Search.."
                    value={query}
                    onFocus={(event) => {
                      if (categoryElement.current) {
                        categoryElement.current.scrollTo({ left: 0, behavior: "smooth" });
                        setSelectedCategory(undefined);
                      }
                    }}
                    onChange={(event) => {
                      setSelectedCategory(undefined);
                      setQuery(event.target.value);
                    }}
                  ></Input>
                </div>
              </div>

              <div
                className={`${cartCollapse ? "w-[calc(100vw-240px)]" : "w-[calc(100vw-640px)]"} h-[70vh] overflow-auto flex flex-wrap justify-start items-start gap-3 mt-3 pb-32 pt-2`}
              >
                {items &&
                  filterItems().map((item, index) => (
                    <ItemCard
                      item={item}
                      units={units}
                      categories={categories}
                      onEdited={() => fetchData()}
                    ></ItemCard>
                  ))}
              </div>
            </>
          }
        </div>
        {customCheckOut ? (
          <CustomCartPanel
            customers={customers}
            onCheckedOut={async () => {}}
            collapsed={cartCollapse as boolean}
            onCollapseChanged={(value) => {
              setCartCollapse(value);
              localStorage.setItem("cartCollapse", value ? "collapse" : "non-collapse");
            }}
          />
        ) : (
          <CartPanel
            customers={customers}
            activeOrders={activeOrders}
            onCheckedOut={async () => {
              fetchActiveOrders();
              fetchCustomers();
            }}
            collapsed={cartCollapse as boolean}
            onCollapseChanged={(value) => {
              setCartCollapse(value);
              localStorage.setItem("cartCollapse", value ? "collapse" : "non-collapse");
            }}
          />
        )}
      </div>
      {enbaleCustomCheckOut && (
        <Button
          className={`w-[110px]  flex flex-row justify-start items-center absolute right-0 bottom-[100px] rounded-3xl rounded-r-none h-12 transition-all origin-right ${cartCollapse ? "scale-x-100" : "scale-x-0"}`}
          onClick={() => {
            setCartCollapse(false);
            setCustomCheckOut(true);
            localStorage.setItem("cartCollapse", "no-collapse");
          }}
        >
          <SquareMenu className="mr-3 size-5" />
          Custom
        </Button>
      )}

      <Button
        className={`w-[110px] flex flex-row justify-start items-center absolute right-0 bottom-10 rounded-3xl rounded-r-none h-12 transition-all origin-right ${cartCollapse ? "scale-x-100" : "scale-x-0"}`}
        onClick={() => {
          setCartCollapse(false);
          setCustomCheckOut(false);
          localStorage.setItem("cartCollapse", "no-collapse");
        }}
      >
        {cartContext.getTotalItem() > 0 ? (
          <span className="size-5 rounded-md bg-amber-500 font-bold mr-3">
            {cartContext.getTotalItem()}
          </span>
        ) : (
          <ShoppingCart className="mr-3 size-5" />
        )}
        Cart
      </Button>
    </div>
  );
}

function ItemCard({
  item,
  units,
  categories,
  onEdited
}: {
  item: Item;
  units: Unit[];
  categories: Category[];
  onEdited?: () => void;
}) {
  const cartContext = useContext(CartContext);
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const { currency, minimumStockColor, minimumStockQuantity } = useContext(AppContext);
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
    <ItemDetailDialog categories={categories} units={units} item={item} onEdited={onEdited}>
      <Card
        className={`rounded-2xl bg-transparent relative overflow-clip transition-all duration-300 active:scale-95 hover:-translate-y-1 cursor-pointer w-[200px] h-[150px] ${cartContext.getTotalSpecificQuantity(item.item_id) > 0 && "border-[3px] border-primary/50 shadow-lg"}`}
      >
        {imageData && (
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Item Image"
            className="absolute bottom-0 top-0 left-0 right-0 w-[200px] h-[150px] -z-[2000]"
          />
        )}
        <CardHeader className="p-4 ">
          <CardTitle className={`${imageData && "text-white"}`}>{item.name}</CardTitle>
          <CardDescription>
            <p className={`${imageData && "text-white"}`}>
              Price - {item.unitPrice} {currency}
            </p>

            {item.useStock ? (
              <p
                style={{
                  color:
                    item.useStock && item.stock < minimumStockQuantity
                      ? minimumStockColor
                      : imageData
                        ? "white"
                        : ""
                }}
              >
                Stock - {item.stock} {extractUnitName(units, item.unitNameId)}
              </p>
            ) : (
              <div className="h-5"></div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end items-center gap-x-2 pb-3 pr-3">
          <Button
            variant={"default"}
            onClick={(event) => {
              event.stopPropagation();
              cartContext.addCart(item, item.unitAmount, {});
            }}
            className="size-8 px-0 rounded-lg text-white"
          >
            <Plus className="size-5" />
          </Button>

          <Button
            variant={"default"}
            onClick={(event) => {
              event.stopPropagation();
              cartContext.removeCart(item, item.unitAmount);
            }}
            className="size-8 px-0 rounded-lg text-white"
          >
            <Minus className="size-5" />
          </Button>
        </CardContent>
      </Card>
    </ItemDetailDialog>
  );
}

export function ItemDetailDialog({
  item,
  children,
  units,
  categories,
  onEdited
}: {
  item: Item;
  children: React.ReactNode;
  units: Unit[];
  categories: Category[];
  onEdited?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const cartContext = useContext(CartContext);
  const { currency, minimumStockColor, minimumStockQuantity } = useContext(AppContext);

  const selectedUnit = units.find((e) => e.unitId === item.unitNameId);
  const selectedCategory = categories.find((e) => e.category_id === item.category_id);

  const { t, i18n } = useTranslation();
  const isEnglishLanguage = i18n.language === "en";

  const [imageData, setImageData] = useState<string | undefined>(undefined);

  const { currentUser } = useContext(UserContext);
  const isCasher = currentUser.role === AppRoles.casher;

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
      <DialogContent hideCloseButton={true} className="max-h-[80vh] overflow-y-auto">
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
            <span className="flex flex-row items-center">
              {item.name}
              {loading && <LoadingWidget height={40} width={40} />}
            </span>
            {!isCasher && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant={"ghost"} size={"icon"} className="my-0">
                    <MoreVertical className="size-5" />
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
                        setLoading(false);
                        setOpen(false);
                        onEdited?.();
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

                        await ItemService.addItem(cloned);
                        toast({
                          title: `Successfully cloned to ${cloned.name}`
                        });
                        setLoading(false);
                        setOpen(false);
                        onEdited?.();
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

                    <ValueInputDialog
                      title="Custom Price"
                      description="Enter total price for all taken item(s)."
                      actionTitle="Add"
                      onSubmit={(value) => {
                        const parsedPrice = parseNumber(value);
                        if (parsedPrice) {
                          cartContext.addCustomPrice(item.item_id, parsedPrice!);
                        } else {
                          toast({
                            title: "Invalid Price"
                          });
                        }
                      }}
                    >
                      <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                        Custom Price
                      </DropdownMenuItem>
                    </ValueInputDialog>
                    <ValueInputDialog
                      title="Custom Quantity"
                      description="Enter quantity you want to take"
                      actionTitle="Add"
                      onSubmit={(value) => {
                        const parsedPrice = parseNumber(value);
                        if (parsedPrice) {
                          cartContext.addCart(item, parsedPrice, { replace: true });
                        } else {
                          toast({
                            title: "Invalid Price"
                          });
                        }
                      }}
                    >
                      <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                        Custom Quantity
                      </DropdownMenuItem>
                    </ValueInputDialog>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="p-2 text-sm cursor-auto select-none">
                        Price Variant
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuGroup>
                            {item.unitPriceVariants.length === 0 && (
                              <DropdownMenuItem>No Variant Price</DropdownMenuItem>
                            )}
                            {item.unitPriceVariants &&
                              item.unitPriceVariants.map((variant) => (
                                <DropdownMenuItem
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    cartContext.addCart(
                                      item,
                                      parseNumber(variant["quantity"]) ?? 0,
                                      {
                                        replace: true,
                                        variantName: variant["name"]
                                      }
                                    );
                                  }}
                                >
                                  {variant["name"] === "null" ||
                                  variant["name"] === null ||
                                  variant["name"] === undefined
                                    ? ""
                                    : variant["name"]}{" "}
                                  [&gt;{variant["quantity"]}] - {variant["price"]}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>

        <div className="pb-5 flex flex-col gap-2">
          <p className="text-sm">
            Price - {item.unitPrice} {currency}
          </p>
          {item.useStock && (
            <div className="w-full flex flex-row justify-between items-center">
              <p className="text-sm">
                <p
                  style={{
                    color:
                      item.useStock && item.stock < minimumStockQuantity ? minimumStockColor : ""
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
                    className="text-xs text-primary cursor-pointer"
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
          )}
          <p
            className={`text-sm ${cartContext.getTotalSpecificQuantity(item.item_id) > 0 && "text-primary"}`}
          >
            In Cart - {cartContext.getTotalSpecificQuantity(item.item_id)}{" "}
            {selectedUnit?.unitName ?? ""} ({cartContext.getTotalSpecificAmount(item.item_id)}{" "}
            {currency})
          </p>
        </div>
        <DialogFooter className="items-center gap-2">
          <Button
            variant={"default"}
            onClick={() => {
              cartContext.addCart(item, item.unitAmount, {});
            }}
            className="size-8 px-0 rounded-lg text-white"
          >
            <Plus className="size-5" />
          </Button>
          <p>{cartContext.getTotalSpecificQuantity(item.item_id)}</p>
          <Button
            variant={"default"}
            onClick={() => {
              cartContext.removeCart(item, item.unitAmount);
            }}
            className="size-8 px-0 rounded-lg text-white"
          >
            <Minus className="size-5" />
          </Button>
          <DialogClose asChild>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
