export interface ItemInterface {
  item_id: string;
  name: string;
  description: string;
  category_id: string;
  barcode: string | null;
  pinned: boolean;
  pinnedTime: Date | null;
  unitNameId: string;
  itemImage: string | null;
  editedDate: Date;
  stock: number;
  unitPrice: number;
  unitAmount: number;
  purchasedPrice: number;
  expiredDate: Date | null;
  useStock: boolean;
  unitPriceVariants: object[]; // {quantity,name,price}
}

export class Item implements ItemInterface {
  item_id: string;
  name: string;
  description: string;
  category_id: string;
  barcode: string | null;
  pinned: boolean;
  pinnedTime: Date | null;
  unitNameId: string;
  itemImage: string | null;
  editedDate: Date;
  stock: number;
  unitPrice: number;
  unitAmount: number;
  purchasedPrice: number;
  expiredDate: Date | null;
  useStock: boolean;
  unitPriceVariants: object[];

  constructor(object: object) {
    const data = object as ItemInterface;
    this.item_id = data.item_id;
    this.name = data.name;
    this.description = data.description;
    this.category_id = data.category_id;
    this.barcode = data.barcode;
    this.pinned = data.pinned;
    this.itemImage = data.itemImage;
    this.stock = data.stock;
    this.unitPrice = data.unitPrice;
    this.unitAmount = data.unitAmount;
    this.purchasedPrice = data.purchasedPrice;
    this.useStock = data.useStock;
    this.unitPriceVariants = data.unitPriceVariants;
    this.unitNameId = data.unitNameId;
    this.editedDate = new Date(data.editedDate);
    this.pinnedTime = data.pinnedTime ? new Date(data.pinnedTime) : null;
    this.expiredDate = data.expiredDate ? new Date(data.expiredDate) : null;
  }

  static fromJson(json: ItemInterface) {
    return new Item(json);
  }

  toJson() {
    return {
      item_id: this.item_id,
      name: this.name,
      description: this.description,
      category_id: this.category_id,
      barcode: this.barcode,
      pinned: this.pinned,
      pinnedTime: this.pinnedTime,
      unitNameId: this.unitNameId,
      itemImage: this.itemImage,
      editedDate: this.editedDate,
      stock: this.stock,
      unitPrice: this.unitPrice,
      unitAmount: this.unitAmount,
      purchasedPrice: this.purchasedPrice,
      expiredDate: this.expiredDate,
      useStock: this.useStock,
      unitPriceVariants: this.unitPriceVariants
    };
  }

  consumeStock(quatity: number) {
    if (!this.useStock) return;
    if (this.useStock) {
      this.stock = this.stock - quatity < 0 ? 0 : this.stock - quatity;
    }
  }

  addStock(quantity: number) {
    this.stock += quantity;
  }
}
