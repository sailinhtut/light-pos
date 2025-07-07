import { offlineMode } from "@renderer/utils/app_constants";
import { Item } from "../interface/item";
import ItemNetworkService from "./item_network_service";
import ItemLocalService from "./item_local_service";
import ItemImageService from "./item_image_local_service";

class ItemService {
  static service = offlineMode ? new ItemLocalService() : new ItemNetworkService();
  static async getItems(): Promise<Item[]> {
    return await this.service.getItems();
  }

  static async getItem(itemId: string): Promise<Item | undefined> {
    return await this.service.getItem(itemId);
  }

  static async addItem(item: Item): Promise<boolean> {
    return await this.service.addItem(item);
  }

  static async updateItem(item: Item): Promise<boolean> {
    return await this.service.updateItem(item);
  }
  static async deleteItem(itemId: string) {
    await this.service.deleteItem(itemId);
    await ItemImageService.deleteImage(itemId);
  }

  static async saveItems(items: Item[]) {
    await this.service.saveItems(items);
  }

  static async backupItems(items: Item[]) {
    await this.service.backupItemBucket(items);
    console.log("Back Up Successfully");
  }

  static async clearItems() {
    await this.service.clearItems();
  }
}

export default ItemService;
