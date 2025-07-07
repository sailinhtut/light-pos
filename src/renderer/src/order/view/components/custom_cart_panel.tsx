import { AppContext } from "@renderer/app/context/app_context";
import { ConfirmDialog } from "@renderer/app/view/components/confirm_dialog";
import LoadingWidget from "@renderer/app/view/components/loading";
import { ValueInputDialog } from "@renderer/app/view/components/value_input_dialog";
import { PrintOrder } from "@renderer/app/view/printer_setting_page";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@renderer/assets/shadcn/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@renderer/assets/shadcn/components/ui/dropdown-menu";
import { Input } from "@renderer/assets/shadcn/components/ui/input";
import { ScrollArea } from "@renderer/assets/shadcn/components/ui/scroll-area";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";
import UserContext from "@renderer/auth/context/user_context";
import { Customer } from "@renderer/customer/interface/customer";
import CustomerService from "@renderer/customer/service/customer_service";
import { CartContext } from "@renderer/order/context/cart_context";
import { CartItem } from "@renderer/order/interface/cart_item";
import { OrderHistory, OrderHistoryInterface } from "@renderer/order/interface/order_history";
import OrderActiveService from "@renderer/order/service/order_active_service";
import OrderHistoryService from "@renderer/order/service/order_history_service";
import { ShopContext } from "@renderer/product/context/shop_context";
import {
  formatNumberWithCommas,
  getTodayParsedID,
  parseNumber,
  sleep,
  uniqueId
} from "@renderer/utils/general_utils";
import { ChevronRight, Minus, MoreVertical, Plus, Printer } from "lucide-react";
import moment from "moment";
import { act, useContext, useEffect, useRef, useState } from "react";
import { isFloat32Array } from "util/types";

export default function CustomCartPanel({
  collapsed,
  onCollapseChanged,
  customers,
  onCheckedOut
}: {
  collapsed: boolean;
  onCollapseChanged: (status) => void;
  customers: Customer[];
  onCheckedOut: () => void;
}) {
  const [scrolling, setScrolling] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [saveCustomer, setSaveCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isPrint, setIsPrint] = useState(true);
  const userContext = useContext(UserContext);

  const { currency } = useContext(AppContext);

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

  const listenScroll = (event) => {
    setScrolling(event.target.scrollTop > 0);
  };

  const processCheckOut = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "No item to check Out"
      });
      return;
    }

    const total = cartItems.map((e) => e.getTotal()).reduce((a, b) => a + b);

    const newOrder: OrderHistoryInterface = {
      orderId: uniqueId(),
      casherName: userContext.currentUser!.name,
      casherId: userContext.currentUser!.docId,
      customer:
        customerName.trim().length === 0
          ? `Order ${moment(new Date()).format("hh:mm A")}`
          : customerName,
      total: total,
      discount: 0,
      tag: 0,
      payAmount: total,
      warrantyMonth: 0,
      date: new Date(),
      amount: total,
      cooking: false,
      ready: false,
      creditBookId: null,
      paid: true,
      metaData: {},
      orders: cartItems
    };

    setCreatingOrder(true);

    if (saveCustomer) {
      await saveCustomerFromName(newOrder.customer);
    }
    setCreatingOrder(false);
    setCartItems([]);
    setCustomerName("");
    setSaveCustomer(false);

    onCheckedOut();
  };

  return (
    <div
      className={`w-[400px] h-[80vh] border rounded-xl sticky top-0 overflow-clip transition-all ${collapsed ? "translate-x-[500px]" : ""}`}
    >
      <div className="p-3 h-[140px]">
        <div className="flex justify-between items-center">
          <p className="h-8 text-lg flex flex-row items-center justify-between gap-x-3">
            Custom Check Out
          </p>
          <CartItemCreateDialog
            title="Add Cart Item"
            description="Enter Item Information"
            onSubmit={(items) => {
              setCartItems([...cartItems, ...items]);
            }}
          >
            <Button variant={"outline"} size={"sm"}>
              Add
            </Button>
          </CartItemCreateDialog>
        </div>
        <div className="flex justify-between">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">Total Item - {formatNumberWithCommas(cartItems.length)} </p>
              <p className="text-sm ">
                Total Amount -{" "}
                {cartItems.length === 0
                  ? 0
                  : formatNumberWithCommas(
                      cartItems.map((e) => e.getTotal()).reduce((a, b) => a + b)
                    )}{" "}
                {currency}
              </p>
            </div>
          </div>
          <Button size={"icon"} variant={"ghost"} onClick={() => onCollapseChanged(true)}>
            <ChevronRight />
          </Button>
        </div>

        <Input
          placeholder="Customer Name"
          className="mt-2 bg-slate-50 dark:bg-slate-800"
          value={customerName}
          onChange={(event) => {
            setCustomerName(event.target.value);
          }}
        />
      </div>
      {scrolling && <hr />}
      <ScrollArea
        className={`h-[calc(80vh-250px)] w-full px-3 ${scrolling && "bg-popover"}`}
        onScrollCapture={listenScroll}
      >
        {cartItems.map((cartItem, index) => {
          return (
            <Card key={index} className="mb-2 mt-1">
              <CardHeader className="px-3 py-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="mb-2">
                    {index + 1}. {cartItem.itemName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <p>Quantity - {cartItem.quantity} Pcs</p>
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
                      cartItem.addQuantity(1);
                      setCartItems(
                        cartItems.filter((e) => (e.itemId === cartItem.itemId ? cartItem : e))
                      );
                    }}
                    className="size-8 px-0 rounded-lg text-primary"
                  >
                    <Plus className="size-5" />
                  </Button>
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      cartItem.removeQuantity(1);
                      const shouldRemoved = cartItem.quantity <= 0;
                      setCartItems(
                        shouldRemoved
                          ? cartItems.filter((e) => e.itemId !== cartItem.itemId)
                          : cartItems.filter((e) => (e.itemId === cartItem.itemId ? cartItem : e))
                      );
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
                              cartItem.usedCustomPrice = true;
                              cartItem.price = parsedPrice;
                              setCartItems(
                                cartItems.filter((e) =>
                                  e.itemId === cartItem.itemId ? cartItem : e
                                )
                              );
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
                              cartItem.quantity = parsedQuantity;
                              setCartItems(
                                cartItems.filter((e) =>
                                  e.itemId === cartItem.itemId ? cartItem : e
                                )
                              );
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
                            setCartItems(cartItems.filter((e) => e.itemId !== cartItem.itemId));
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
            className={`px-3 pt-3 flex flex-row justify-between items-center ${cartItems.length > 0 && "border-t"}`}
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
              <PrintOrder
                order={OrderHistory.fromJson({
                  orderId: "",
                  casherName: userContext.currentUser!.name,
                  casherId: userContext.currentUser!.docId,
                  customer:
                    customerName.trim().length === 0
                      ? `Order ${moment(new Date()).format("hh:mm A")}`
                      : customerName,
                  total:
                    cartItems.length === 0
                      ? 0
                      : cartItems.map((e) => e.getTotal()).reduce((a, b) => a + b),
                  discount: 0,
                  tag: 0,
                  payAmount:
                    cartItems.length === 0
                      ? 0
                      : cartItems.map((e) => e.getTotal()).reduce((a, b) => a + b),
                  warrantyMonth: 0,
                  date: new Date(),
                  amount:
                    cartItems.length === 0
                      ? 0
                      : cartItems.map((e) => e.getTotal()).reduce((a, b) => a + b),
                  cooking: false,
                  ready: false,
                  creditBookId: null,
                  paid: true,
                  metaData: {},
                  orders: cartItems
                })}
              >
                <Button variant={"outline"} size={"icon"}>
                  <Printer className="size-4" />
                </Button>
              </PrintOrder>
            </div>
          </div>
          <div className={`px-3 py-3  flex gap-x-3 `}>
            <Button className="w-full text-white" onClick={() => processCheckOut()}>
              Check Out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CartItemCreateDialog({
  onSubmit,
  title = "Input",
  description,
  children
}: {
  onSubmit: (items: CartItem[]) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addEmptyItem = () => {
    const newEmptyItem = CartItem.fromJson({
      itemId: uniqueId(),
      itemName: "",
      itemDescription: "",
      quantity: 0,
      variantName: null,
      price: 0,
      purchasedPrice: 0,
      usedCustomPrice: false,
      priceVariants: [],
      children: []
    });
    setCartItems([...cartItems, newEmptyItem]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent hideCloseButton={true} className="max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <div className="flex flex-row justify-between items-center">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <Button variant={"outline"} size={"sm"} onClick={addEmptyItem}>
              <Plus />
            </Button>
          </div>
        </DialogHeader>
        {cartItems.map((cartItem, index) => (
          <div className="flex flex-row items-center gap-x-2 ">
            <div className="flex flex-col w-1/4 ">
              <p className="mb-1">Name</p>
              <Input
                type="text"
                value={cartItem.itemName}
                onChange={(event) => {
                  cartItem.itemName = event.target.value;
                  setCartItems(
                    cartItems.filter((e) => (e.itemId === cartItem.itemId ? cartItem : e))
                  );
                }}
              ></Input>
            </div>
            <div className="flex flex-col w-1/3">
              <p className="mb-1">Price</p>
              <Input
                type="number"
                value={cartItem.price}
                onChange={(event) => {
                  const price = parseNumber(event.target.value) ?? 0;
                  cartItem.purchasedPrice = price;
                  cartItem.price = price;
                  setCartItems(
                    cartItems.filter((e) => (e.itemId === cartItem.itemId ? cartItem : e))
                  );
                }}
              ></Input>
            </div>
            <div className="flex flex-col w-1/3">
              <p className="mb-1">Quantity</p>
              <Input
                type="number"
                value={cartItem.quantity}
                onChange={(event) => {
                  const quantity = parseNumber(event.target.value) ?? 0;
                  cartItem.quantity = quantity;
                  setCartItems(
                    cartItems.filter((e) => (e.itemId === cartItem.itemId ? cartItem : e))
                  );
                }}
              ></Input>
            </div>
          </div>
        ))}
        <DialogFooter>
          <DialogClose>
            <Button variant={"outline"}>Close</Button>
          </DialogClose>
          <Button
            onClick={() => {
              const validatedCartItems = cartItems.filter((e) => {
                return e.itemName.trim().length > 0 && e.quantity > 0 && e.price > 0;
              });
              onSubmit(validatedCartItems);
              setCartItems([]);
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
