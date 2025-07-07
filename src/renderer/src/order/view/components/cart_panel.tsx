import { AppContext } from "@renderer/app/context/app_context";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import LoadingWidget from "@renderer/app/view/components/loading";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import { generatePrinterReceipt, PrintOrder } from "@renderer/app/view/printer_setting_page";
import { Badge } from "@renderer/assets/shadcn/components/ui/badge";
import { Button } from "@renderer/assets/shadcn/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@renderer/assets/shadcn/components/ui/card";
import { Checkbox } from "@renderer/assets/shadcn/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@renderer/assets/shadcn/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@renderer/assets/shadcn/components/ui/popover";
import { ScrollArea } from "@renderer/assets/shadcn/components/ui/scroll-area";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import UserContext from "@renderer/auth/context/user_context";
import { Customer } from "@renderer/customer/interface/customer";
import CustomerService from "@renderer/customer/service/customer_service";
import { CartContext } from "@renderer/order/context/cart_context";
import { OrderHistory, OrderHistoryInterface } from "@renderer/order/interface/order_history";
import OrderActiveService from "@renderer/order/service/order_active_service";
import OrderHistoryLocalService from "@renderer/order/service/order_history_local_service";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import { ShopContext } from "@renderer/product/context/shop_context";
import { offlineMode } from "@renderer/utils/app_constants";
import {
  formatNumberWithCommas,
  getTodayParsedID,
  parseNumber,
  sleep,
  uniqueId
} from "@renderer/utils/general_utils";
import {
  CheckIcon,
  ChevronRight,
  Key,
  Minus,
  MoreVertical,
  Plus,
  Printer,
  ScanBarcode
} from "lucide-react";
import moment from "moment";
import { act, useContext, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { isFloat32Array } from "util/types";
import parse from "html-react-parser";

export default function CartPanel({
  collapsed,
  onCollapseChanged,
  activeOrders,
  customers,
  onCheckedOut
}: {
  collapsed: boolean;
  onCollapseChanged: (status) => void;
  activeOrders: OrderHistory[];
  customers: Customer[];
  onCheckedOut: () => void;
}) {
  const [scrolling, setScrolling] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderHistory | undefined>();
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [saveCustomer, setSaveCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const cartContext = useContext(CartContext);
  const shopContext = useContext(ShopContext);
  const userContext = useContext(UserContext);

  const { currency, autoCheckOut, autoCheckOutSecond } = useContext(AppContext);

  const [checkOutCount, setCheckOutCount] = useState(0);
  const [autoCheckOutTimer, setAutoCheckOutTimer] = useState<NodeJS.Timeout | undefined>(undefined);

  const [nameInputFocus, setNameInputFocus] = useState(false);

  const scanRef = useRef("");

  useEffect(
    function () {
      localStorage.setItem("cartItemCount", String(cartContext.cartItems.length));
      if (cartContext.cartItems.length > 0) {
        pauseAutoCheckOut();
        setCheckOutCount(autoCheckOutSecond);
        startAutoCheckOut();
      }

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    },
    [cartContext.cartItems, shopContext.items]
  );

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      searchAndAddCart(scanRef.current);
    }
    if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key.length === 1) {
      scanRef.current += event.key;
    }
  };

  const searchAndAddCart = (barcode) => {
    if (shopContext.items.length === 0) {
      toast({
        title: `No Item To Scan`,
        duration: 1000
      });
      scanRef.current = "";
      return;
    }

    const matched = shopContext.items.filter((e) => {
      return String(e.barcode).trim() === String(barcode).trim();
    });

    const filtered = matched.length === 0 ? undefined : matched;

    if (filtered) {
      filtered.sort((a, b) => b.editedDate.getTime() - a.editedDate.getTime());
      cartContext.addCart(filtered[0], filtered[0].unitAmount, {});
      scanRef.current = "";
    } else {
      scanRef.current = "";
    }
  };

  const startAutoCheckOut = () => {
    if (autoCheckOut) {
      const timerId = setInterval(() => {
        setCheckOutCount((previousValue) => {
          if (previousValue - 1 <= 0) {
            const cartItemCounts = parseNumber(localStorage.getItem("cartItemCount") ?? "") ?? 0;
            if (cartItemCounts > 0) {
              processCheckOut();
            }
            clearInterval(timerId);
            setAutoCheckOutTimer(undefined);
            return 0;
          }
          return previousValue - 1;
        });
      }, 1000);
      setAutoCheckOutTimer(timerId);
    }
  };

  const pauseAutoCheckOut = () => {
    clearInterval(autoCheckOutTimer);
    setAutoCheckOutTimer(undefined);
  };

  const saveCustomerFromName = async (customerName: string) => {
    if (!customerName.trim().startsWith("Order") && customerName.trim().length !== 0) {
      const existedCustomer = customers.find(
        (e) => e.name.toLocaleLowerCase() === String(customerName).toLocaleLowerCase()
      );
      if (!existedCustomer) {
        const newCustomer: Customer = {
          customerId: uniqueId(),
          name: customerName,
          note: "",
          phoneOne: "",
          phoneTwo: "",
          created_at: new Date(),
          updated_at: new Date(),
          attachments: []
        };
        await CustomerService.addCustomer(newCustomer);
      }
    }
  };

  const searchCustomer = async (customerName: string) => {
    const matched = activeOrders.find((e) => e.customer === customerName);
    setActiveOrder(matched);
    if (matched) {
      localStorage.setItem("cartActiveOrder", JSON.stringify(matched.toJson()));
    } else {
      localStorage.removeItem("cartActiveOrder");
    }
  };

  const listenScroll = (event) => {
    setScrolling(event.target.scrollTop > 0);
  };

  const processCreateOrder = async () => {
    if (searchingCustomer) {
      toast({ title: "Searching active customer. Please wait" });
      return;
    }
    // if (cartContext.cartItems.length === 0) {
    //   toast({
    //     title: "No item to check out"
    //   });
    //   return;
    // }
    if (activeOrder) {
      activeOrder.intelligentAddAll(cartContext.cartItems);
      activeOrder.amount = activeOrder.getAmount();

      setCreatingOrder(true);
      await OrderActiveService.updateOrderHistory(activeOrder);
      shopContext.removeStockByCart(cartContext.cartItems);

      if (saveCustomer) {
        saveCustomerFromName(activeOrder.customer);
      }

      cartContext.clearCart();
      setCustomerName("");
      localStorage.removeItem("cartCustomerName");
      setCreatingOrder(false);
    } else {
      const newOrder: OrderHistoryInterface = {
        orderId: uniqueId(),
        casherName: userContext.currentUser!.name,
        casherId: userContext.currentUser!.docId,
        customer:
          customerName.trim().length === 0
            ? `Order ${moment(new Date()).format("hh:mm A")}`
            : customerName,
        total: cartContext.getTotalAmount(),
        discount: 0,
        tag: 0,
        payAmount: cartContext.getTotalAmount(),
        warrantyMonth: 0,
        amount: cartContext.getTotalAmount(),
        date: new Date(),
        cooking: false,
        ready: false,
        creditBookId: null,
        paid: true,
        metaData: {},
        orders: [...cartContext.cartItems]
      };

      setCreatingOrder(true);
      await OrderActiveService.addOrderHistory(OrderHistory.fromJson(newOrder));
      shopContext.removeStockByOrder(OrderHistory.fromJson(newOrder));

      if (saveCustomer) {
        saveCustomerFromName(newOrder.customer);
      }

      cartContext.clearCart();
      setCustomerName("");
      localStorage.removeItem("cartCustomerName");
      setCreatingOrder(false);
    }

    onCheckedOut();
    pauseAutoCheckOut();
    setActiveOrder(undefined);
    localStorage.removeItem("cartActiveOrder");
    setSaveCustomer(false);

    await sleep(2);
    await shopContext.fetchData();
  };

  const processCheckOut = async () => {
    if (searchingCustomer) {
      toast({ title: "Searching active customer. Please wait" });
      return;
    }
    if (cartContext.cartItems.length === 0) {
      toast({
        title: "No item to check Out"
      });
      return;
    }

    const savedOrderJson = localStorage.getItem("cartActiveOrder");
    const savedActiveOrder = savedOrderJson
      ? OrderHistory.fromJson(JSON.parse(savedOrderJson))
      : undefined;

    if (savedActiveOrder) {
      savedActiveOrder.intelligentAddAll(cartContext.cartItems);
      savedActiveOrder.amount = savedActiveOrder.getAmount();
      savedActiveOrder.total = savedActiveOrder.calculateTotal();
      savedActiveOrder.payAmount = savedActiveOrder.calculateTotal();
      savedActiveOrder.paid = true;

      setCreatingOrder(true);
      await OrderActiveService.deleteOrderHistory(savedActiveOrder.orderId);

      // decide offline version and offline mode
      if (offlineMode) {
        await OrderHistoryService.addOrderHistory(
          getTodayParsedID(savedActiveOrder.date),
          savedActiveOrder
        );
      } else {
        if (navigator.onLine) {
          await OrderHistoryService.addOrderHistory(
            getTodayParsedID(savedActiveOrder.date),
            savedActiveOrder
          );
        } else {
          await new OrderHistoryLocalService().addOrderHistory(
            getTodayParsedID(savedActiveOrder.date),
            savedActiveOrder
          );
        }
      }

      shopContext.removeStockByCart(cartContext.cartItems);

      if (saveCustomer) {
        saveCustomerFromName(savedActiveOrder.customer);
      }
    } else {
      const savedCustomerName = localStorage.getItem("cartCustomerName") ?? "";
      const newOrder: OrderHistoryInterface = {
        orderId: uniqueId(),
        casherName: userContext.currentUser!.name,
        casherId: userContext.currentUser!.docId,
        customer:
          savedCustomerName.trim().length === 0
            ? `Order ${moment(new Date()).format("hh:mm A")}`
            : savedCustomerName,
        total: cartContext.getTotalAmount(),
        discount: 0,
        tag: 0,
        payAmount: cartContext.getTotalAmount(),
        warrantyMonth: 0,
        amount: cartContext.getTotalAmount(),
        date: new Date(),
        cooking: false,
        ready: false,
        creditBookId: null,
        paid: true,
        metaData: {},
        orders: [...cartContext.cartItems]
      };

      setCreatingOrder(true);
      if (offlineMode) {
        await OrderHistoryService.addOrderHistory(
          getTodayParsedID(newOrder.date),
          OrderHistory.fromJson(newOrder)
        );
      } else {
        if (navigator.onLine) {
          await OrderHistoryService.addOrderHistory(
            getTodayParsedID(newOrder.date),
            OrderHistory.fromJson(newOrder)
          );
        } else {
          await new OrderHistoryLocalService().addOrderHistory(
            getTodayParsedID(newOrder.date),
            OrderHistory.fromJson(newOrder)
          );
        }
      }

      shopContext.removeStockByOrder(OrderHistory.fromJson(newOrder));

      if (saveCustomer) {
        saveCustomerFromName(newOrder.customer);
      }
    }

    setCustomerName("");
    localStorage.removeItem("cartCustomerName");
    cartContext.clearCart();
    localStorage.removeItem("cartItemCount");
    setCreatingOrder(false);

    onCheckedOut();
    pauseAutoCheckOut();
    setActiveOrder(undefined);
    localStorage.removeItem("cartActiveOrder");
    setSaveCustomer(false);
    await sleep(2);
    await shopContext.fetchData();
  };

  return (
    <div
      className={`w-[400px] h-[80vh] border rounded-xl sticky top-0 overflow-clip transition-all ${collapsed ? "translate-x-[500px]" : ""}`}
    >
      <div className="p-3 h-[140px]">
        <div className="flex justify-between items-center">
          <p className="h-8 text-lg flex flex-row items-center justify-between gap-x-3">
            Cart Preview {searchingCustomer && <LoadingWidget width={35} height={35} />}
          </p>
          {activeOrder && (
            <Badge
              variant={"outline"}
              className="bg-primary/30 rounded-lg border-primary text-primary   px-2 py-0.5  "
            >
              Active Customer
            </Badge>
          )}
        </div>
        <div className="flex justify-between">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                Total Item - {formatNumberWithCommas(cartContext.getTotalItem())}{" "}
              </p>
              <p className="text-sm ">
                Total Amount - {formatNumberWithCommas(cartContext.getTotalAmount())} {currency}
              </p>
            </div>
          </div>
          <Button size={"icon"} variant={"ghost"} onClick={() => onCollapseChanged(true)}>
            <ChevronRight />
          </Button>
        </div>

        <div className="relative">
          <Input
            placeholder="Customer Name"
            className="mt-2 bg-slate-50 dark:bg-slate-800"
            value={customerName}
            onFocus={() => setNameInputFocus(true)}
            onBlur={() => setNameInputFocus(false)}
            onChange={(event) => {
              setCustomerName(event.target.value);
              localStorage.setItem("cartCustomerName", event.target.value);
              searchCustomer(event.target.value);
            }}
          />
          {customers.filter((e) =>
            customerName.trim().length === 0
              ? false
              : e.name.toLocaleLowerCase().includes(customerName.toLocaleLowerCase())
          ).length > 0 && (
            <div
              className={`w-full absolute top-10 bg-popover rounded-lg p-1 border ${nameInputFocus ? "" : "hidden"} z-[1000]`}
              onMouseDown={(e) => e.preventDefault()}
            >
              {customers
                .filter((e) =>
                  customerName.trim().length === 0
                    ? false
                    : e.name.toLocaleLowerCase().includes(customerName.toLocaleLowerCase())
                )
                .map((customer) => (
                  <div
                    className="px-2 py-2 hover:bg-primary/80 text-sm hover:text-white hover:rounded-md cursor-auto select-none"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setCustomerName(customer.name);
                      localStorage.setItem("cartCustomerName", customer.name);
                      searchCustomer(customer.name);
                      setNameInputFocus(false);
                    }}
                  >
                    {customer.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {scrolling && <hr />}
      <ScrollArea
        className={`h-[calc(80vh-250px)] w-full px-3 ${scrolling && "bg-popover"}`}
        onScrollCapture={listenScroll}
      >
        {cartContext.cartItems.map((cartItem, index) => {
          const parentItem = shopContext.items.find((e) => e.item_id === cartItem.itemId);

          const selectedUnit = shopContext.units.find((e) => e.unitId === parentItem?.unitNameId);

          return (
            <Card key={index} className="mb-2 mt-1">
              <CardHeader className="px-3 py-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="mb-2">
                    {index + 1}. {cartItem.itemName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <p>
                      Quantity - {cartItem.quantity} {selectedUnit?.unitName ?? ""}
                    </p>
                    <p>
                      Cost - {formatNumberWithCommas(cartItem.getTotal())} {currency}
                    </p>
                    <p>
                      {cartItem.usedCustomPrice && "(Custom Price)"}{" "}
                      {cartItem.variantName && `(${cartItem.variantName})`}
                    </p>
                  </CardDescription>
                </div>
                <div className="flex gap-x-3">
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      if (parentItem) {
                        cartContext.addCart(parentItem, parentItem.unitAmount, {});
                      }
                    }}
                    className="size-8 px-0 rounded-lg text-primary"
                  >
                    <Plus className="size-5" />
                  </Button>
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      if (parentItem) {
                        cartContext.removeCart(parentItem, parentItem.unitAmount);
                      }
                    }}
                    className="size-8 px-0 rounded-lg text-primary"
                  >
                    <Minus className="size-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant={"ghost"} size={"icon"} className="my-0">
                        <MoreVertical className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        <ValueInputDialog
                          title="Custom Price"
                          description="Enter total price for all taken item(s)."
                          actionTitle="Set"
                          onSubmit={(value) => {
                            const parsedPrice = parseNumber(value);
                            if (parsedPrice) {
                              cartContext.addCustomPrice(cartItem.itemId, parsedPrice!);
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
                            const parsedQuantity = parseNumber(value);
                            if (parsedQuantity) {
                              if (parentItem) {
                                cartContext.addCart(parentItem, parsedQuantity, { replace: true });
                              }
                            } else {
                              toast({
                                title: "Invalid Quantity"
                              });
                            }
                          }}
                        >
                          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            Custom Quantity
                          </DropdownMenuItem>
                        </ValueInputDialog>
                        <ConfirmDialog
                          actionVariant={"destructive"}
                          title={`Remove ${cartItem.itemName}`}
                          description={`Are you sure to delete ${cartItem.itemName} from cart?`}
                          actionTitle="Remove"
                          onConfirm={() => {
                            if (parentItem) {
                              cartContext.removeCart(parentItem, cartItem.quantity);
                            }
                          }}
                        >
                          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            Remove
                          </DropdownMenuItem>
                        </ConfirmDialog>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </ScrollArea>
      {creatingOrder ? (
        <div className="flex justify-center">
          <LoadingWidget />
        </div>
      ) : (
        <div className="h-[110px] flex flex-col just">
          <div
            className={`px-3 pt-3 flex flex-row justify-between items-center ${cartContext.cartItems.length > 0 && "border-t"}`}
          >
            <div className="flex flex-row items-center ">
              <Checkbox
                checked={saveCustomer}
                onCheckedChange={(value) => setSaveCustomer(value)}
                className="mr-3"
              ></Checkbox>
              <span
                className="text-sm cursor-auto select-none"
                onClick={() => setSaveCustomer(!saveCustomer)}
              >
                Save Customer
              </span>
            </div>
            <div className="flex flex-row items-center gap-2">
              {autoCheckOut && (
                <Button
                  variant={autoCheckOutTimer ? "default" : "outline"}
                  size={"icon"}
                  onClick={() => {
                    if (autoCheckOutTimer) {
                      pauseAutoCheckOut();
                    } else {
                      startAutoCheckOut();
                    }
                  }}
                >
                  {checkOutCount}
                </Button>
              )}

              {/* <Button variant={"outline"} size={"icon"}>
                <ScanBarcode className="size-4" />
              </Button> */}

              <PrintOrder
                order={OrderHistory.fromJson({
                  orderId: "",
                  casherName: userContext.currentUser!.name,
                  casherId: userContext.currentUser!.docId,
                  customer:
                    customerName.trim().length === 0
                      ? `Order ${moment(new Date()).format("hh:mm A")}`
                      : customerName,
                  total: cartContext.getTotalAmount(),
                  discount: 0,
                  tag: 0,
                  payAmount: cartContext.getTotalAmount(),
                  warrantyMonth: 0,
                  amount: cartContext.getTotalAmount(),
                  date: new Date(),
                  cooking: false,
                  ready: false,
                  creditBookId: null,
                  paid: true,
                  metaData: {},
                  orders: [...cartContext.cartItems]
                })}
              >
                <Button size={"icon"}>
                  <Printer className="size-4" />
                </Button>
              </PrintOrder>
            </div>
          </div>
          <div className={`px-3 py-3  flex gap-x-3 `}>
            <Button className="w-full text-white" onClick={() => processCheckOut()}>
              Check Out
            </Button>
            <Button className="w-full text-white" onClick={() => processCreateOrder()}>
              {activeOrder ? "Add More" : "Create Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
