//   String itemId;
//   String itemName;
//   String itemDescription;
//   num quantity;
//   String? variantName;
//   num price;
//   num purchasedPrice;
//   bool usedCustomPrice;
//   List<Map<dynamic, dynamic>> priceVariants;
//   List<CartItem>? children;

export interface CartItemInterface {
  itemId: string;
  itemName: string;
  itemDescription: string;
  quantity: number;
  variantName: string | null;
  price: number;
  purchasedPrice: number;
  usedCustomPrice: boolean;
  priceVariants: object[];
  children: CartItem[];
}

export function encodeCartItemJson(cartItem: CartItem) {
  return {
    itemId: cartItem.itemId,
    itemName: cartItem.itemName,
    itemDescription: cartItem.itemDescription,
    quantity: cartItem.quantity,
    variantName: cartItem.variantName,
    price: cartItem.price,
    purchasedPrice: cartItem.purchasedPrice,
    usedCustomPrice: cartItem.usedCustomPrice,
    priceVariants: cartItem.priceVariants,
    children: cartItem.children
  };
}

export class CartItem implements CartItemInterface {
  itemId: string;
  itemName: string;
  itemDescription: string;
  quantity: number;
  variantName: string | null;
  price: number;
  purchasedPrice: number;
  usedCustomPrice: boolean;
  priceVariants: object[];
  children: CartItem[];

  constructor(object: object) {
    const data = object as CartItemInterface;
    this.itemId = data.itemId;
    this.itemName = data.itemName;
    this.itemDescription = data.itemDescription;
    this.quantity = data.quantity;
    this.variantName = data.variantName ?? null;
    this.price = data.price;
    this.purchasedPrice = data.purchasedPrice;
    this.usedCustomPrice = data.usedCustomPrice;
    this.priceVariants = data.priceVariants ?? [];
    this.children =
      data.children && data.children.length > 0
        ? data.children.map((e) => CartItem.fromJson(e))
        : [];
  }

  static fromJson(json: CartItemInterface) {
    return new CartItem(json);
  }

  toJson() {
    return JSON.parse(JSON.stringify(this));
  }

  get usedPriceVariant() {
    return this.priceVariants.find((e) => e["quantity"] == this.quantity) != undefined;
  }

  addQuantity(quantity: number) {
    this.quantity += quantity;
  }

  freshQuantity(quantity: number) {
    this.quantity = quantity;
  }

  removeQuantity(quantity: number) {
    if (this.quantity == 0) {
      return;
    } else if (quantity > this.quantity) {
      this.quantity = 0;
      return;
    } else {
      this.quantity -= quantity;
    }
  }

  getVariantPrice(
    quantity: number,
    { variantName }: { variantName?: string | null }
  ): number | undefined {
    if (this.priceVariants.length > 0) {
      const selectedVariant =
        this.priceVariants.length > 0
          ? this.priceVariants.find((element) => {
              if (quantity >= element["quantity"]) {
                if (variantName != null) {
                  return variantName == element["name"];
                } else {
                  return false;
                }
              }
              return false;
            })
          : null;
      if (selectedVariant == null) return undefined;
      const variantUnitPrice = selectedVariant["price"];
      return quantity * variantUnitPrice;
    }
    return undefined;
  }

  getTotal() {
    return this.usedCustomPrice
      ? this.price
      : this.getVariantPrice(this.quantity, { variantName: this.variantName }) ??
          this.quantity * this.price;
  }

  getTotalPurchasedPrice() {
    return this.purchasedPrice * this.quantity;
  }

  getTotalChildrenQuantity({ excludeMe }: { excludeMe?: boolean }) {
    if (this.children == undefined || (this.children != undefined && this.children.length === 0)) {
      return 1;
    }

    const total = this.children!.length;

    return total + (excludeMe ? 1 : 0);
  }

  getTotalChildren({ includeMe = true }: { includeMe?: boolean }) {
    if (this.children == undefined || (this.children != undefined && this.children.length === 0)) {
      return this.getTotal();
    }

    const total = this.children!.map((e) => e.getTotal()).reduce(
      (value, element) => value + element
    );

    return total + (includeMe ? this.getTotal() : 0);
  }

  getTotalChildrenPurchasedPrice({ includeMe }: { includeMe?: boolean }) {
    if (this.children == undefined || (this.children != undefined && this.children.length === 0)) {
      return this.getTotalPurchasedPrice();
    }

    const total = this.children!.map((e) => e.getTotalPurchasedPrice()).reduce(
      (value, element) => value + element
    );

    return total + (includeMe ? this.getTotalPurchasedPrice() : 0);
  }
}
