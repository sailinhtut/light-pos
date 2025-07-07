import Dexie, { Table } from "dexie";
import { Item, ItemInterface } from "../interface/item";

class ItemDatabase extends Dexie {
  items!: Table<ItemInterface, string>;

  constructor() {
    super("product_data");
    this.version(1).stores({
      items:
        "item_id,name,description,categoryId,barcode,pinned,pinnedTime,unitNameId,itemImage,editedDate,stock,unitPrice,unitAmount,purchasedPrice,expiredDate,useStock,unitPriceVariants"
    });
  }
}

class ItemLocalService {
  db = new ItemDatabase().items;

  async getItems(): Promise<Item[]> {
    const data = await this.db.toArray();
    const decoded = data.map((element) => Item.fromJson(element));
    return decoded;
  }

  async getItem(productId: string): Promise<Item | undefined> {
    const data = await this.db.get(productId);
    return data ? Item.fromJson(data) : undefined;
  }

  async addItem(product: Item): Promise<boolean> {
    await this.db.put(product, product.item_id);
    return true;
  }
  async updateItem(product: Item): Promise<boolean> {
    await this.db.put(product, product.item_id);
    return true;
  }

  async deleteItem(productId: string) {
    await this.db.delete(productId);
  }

  async saveItems(items: Item[]) {
    this.clearItems();
    items.forEach((item) => {
      this.updateItem(item);
    });
  }
  async backupItemBucket(items: Item[]) {
    return;
  }

  async clearItems() {
    await this.db.clear();
  }
}

export default ItemLocalService;
