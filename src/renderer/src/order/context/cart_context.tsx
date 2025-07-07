import { createContext, useState } from "react";
import { CartItem } from "../interface/cart_item";
import { Item } from "@renderer/product/interface/item";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";

interface CartContextInterface {
  cartItems: CartItem[];
  addCart: (
    item: Item,
    quantity: number,
    { replace, variantName }: { replace?: boolean; variantName?: string }
  ) => void;
  removeCart: (item: Item, quantity: number) => void;

  addCustomPrice: (itemId: string, price: number) => void;
  clearCart: () => void;
  getTotalItem: () => number;
  getTotalAmount: () => number;
  getTotalSpecificQuantity: (itemId: string) => number;
  getTotalSpecificAmount: (itemId: string) => number;
}

const defaultCartContext: CartContextInterface = {
  cartItems: [],
  addCart: () => {},
  removeCart: () => {},
  addCustomPrice: () => {},
  clearCart: () => {},
  getTotalItem: () => 0,
  getTotalAmount: () => 0,
  getTotalSpecificQuantity: () => 0,
  getTotalSpecificAmount: () => 0
};
export const CartContext = createContext<CartContextInterface>(defaultCartContext);

export default function CartContextProvider({ children }: { children?: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add Item to Cart
  const addCart = (
    item: Item,
    quantity: number,
    { replace, variantName }: { replace?: boolean; variantName?: string }
  ) => {
    if (item.useStock && item.stock <= 0) {
      toast({
        title: <p className="text-red-500">No Stock In {item.name}</p>,
        duration: 1000
      });
      return;
    }

    if (item.useStock && quantity > item.stock) {
      toast({
        title: <p className="text-red-500">No Enough Stock</p>,
        duration: 1000
      });
      return;
    }

    const result = cartItems.find((e) => e.itemId == item.item_id);

    if (result != undefined) {
      if (variantName != null) {
        result.variantName = variantName;
      }
      if (replace) {
        item.addStock(result.quantity); // refill back
        result.freshQuantity(quantity);
        if (item.useStock) item.consumeStock(quantity);
      } else {
        result.addQuantity(quantity);
        if (item.useStock) item.consumeStock(quantity);
      }

      setCartItems([...cartItems]);
    } else {
      const newCartItem = CartItem.fromJson({
        itemId: item.item_id,
        itemName: item.name ?? "Unknown Item",
        itemDescription: item.description ?? "",
        price: item.unitPrice,
        priceVariants: item.unitPriceVariants,
        purchasedPrice: item.purchasedPrice,
        quantity: quantity,
        variantName: variantName ?? null,
        children: [],
        usedCustomPrice: false
      });
      setCartItems([...cartItems, newCartItem]);
      if (item.useStock) item.consumeStock(quantity);
    }
  };

  // Set Custom Price to Item (which is in Cart)
  const addCustomPrice = (itemId: string, price: number) => {
    const result = cartItems.find((e) => e.itemId == itemId);

    if (result != undefined) {
      result.price = price;
      result.usedCustomPrice = true; // required this
      setCartItems([...cartItems]);
      toast({ title: "Applied Customer Price" });
    } else {
      toast({ title: "Please insert item first" });
    }
  };

  // Remove Item from Cart
  const removeCart = (item: Item, quantity: number) => {
    const matched = cartItems.find((element) => element.itemId === item.item_id);
    if (matched != undefined) {
      matched.removeQuantity(quantity);
      if (item.useStock) item.addStock(quantity);
      setCartItems([...cartItems]);
      if (matched.quantity < item.unitAmount) {
        setCartItems(cartItems.filter((e) => e.itemId !== item.item_id));
        if (matched.quantity > 0 && item.useStock) {
          item.addStock(matched.quantity);
        }
      }
    }
  };

  // Clear Cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get Total Cart Quantity
  const getTotalItem = () => {
    return cartItems.length;
  };

  // Get Total Amount
  const getTotalAmount = () => {
    const allCosts = cartItems.map((e) => e.getTotal());
    return allCosts.length > 0 ? allCosts.reduce((a, b) => a + b) : 0;
  };

  // Get Total Quantity on a item
  const getTotalSpecificQuantity = (itemId: string) => {
    const matched = cartItems.find((e) => e.itemId === itemId);
    return matched ? matched.quantity : 0;
  };

  // Get Total Amount on a item
  const getTotalSpecificAmount = (itemId: string) => {
    const matched = cartItems.find((e) => e.itemId === itemId);
    return matched ? matched.getTotal() : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: cartItems,
        addCart: addCart,
        removeCart: removeCart,
        addCustomPrice: addCustomPrice,
        clearCart: clearCart,
        getTotalItem: getTotalItem,
        getTotalAmount: getTotalAmount,
        getTotalSpecificQuantity: getTotalSpecificQuantity,
        getTotalSpecificAmount: getTotalSpecificAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
