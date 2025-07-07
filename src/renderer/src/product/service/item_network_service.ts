import { Item } from "../interface/item";
import FirebaseStorageService from "@renderer/app/service/firebase_storage_service";
import { decodeGzip, encodeGzip } from "@renderer/utils/encrypt_utils";
import { noConnection } from "@renderer/utils/general_utils";
import ItemLocalService from "./item_local_service";
import { toast } from "@renderer/assets/shadcn/components/ui/use-toast";

// Cloud Firestore
// class ItemNetworkService {
//   itemCollection = "items";
//
//   async getItems(): Promise<Item[]> {
//     const snap = await firebaseFirestore.collection(this.itemCollection).get();
//     if (snap.docs.length > 0) {
//       const data = snap.docs.map((docSnap) => decodeItemJson(docSnap.data()));
//       return data;
//     }
//     return [];
//   }
//
//   async getItem(itemId: string): Promise<Item | undefined> {
//     const docSnap = await firebaseFirestore.collection(this.itemCollection).doc(itemId).get();
//     if (docSnap.exists && docSnap.data()) {
//       const data = decodeItemJson(docSnap.data()!);
//       return data;
//     }
//     return undefined;
//   }
//
//   async addItem(item: Item) {
//     await firebaseFirestore
//       .collection(this.itemCollection)
//       .doc(item.itemId)
//       .set(encodeItemJson(item));
//   }
//
//   async updateItem(item: Item) {
//     await firebaseFirestore
//       .collection(this.itemCollection)
//       .doc(item.itemId)
//       .update(encodeItemJson(item));
//   }
//   async deleteItem(itemId: string) {
//     await firebaseFirestore.collection(this.itemCollection).doc(itemId).delete();
//   }
// }

/// Cloud Storage Item Service
class ItemNetworkService {
  itemLocalService = new ItemLocalService();

  async writeItemBucket(items: Item[]) {
    const data = items.map((element) => element);
    const encoded = encodeGzip(JSON.stringify(data));
    await FirebaseStorageService.uploadString({
      name: "data/items",
      data: encoded,
      type: ""
    });
  }

  async backupItemBucket(items: Item[]) {
    if (items.length === 0) return;
    if (items.find((e) => e.item_id === "error-item") != undefined) return;
    const data = items.map((element) => element);
    const encoded = encodeGzip(JSON.stringify(data));
    await FirebaseStorageService.uploadString({
      name: "backup/backup_data",
      data: encoded,
      type: ""
    });
  }

  async readItemBucket(): Promise<Item[]> {
    try {
      const result = await FirebaseStorageService.download({
        refPath: "data/items"
      });
      const data = decodeGzip(result.data);
      const decoded = (JSON.parse(data) as []).map((element) => Item.fromJson(element));
      return decoded;
    } catch (error: any) {
      return [
        Item.fromJson({
          item_id: "error-item",
          name: "Error",
          description: `Sorry for inconvenience.\nContact Us $phoneOne $phoneTwo.\n Error Code - $e`,
          stock: 0,
          unitAmount: 1,
          unitPrice: 0,
          purchasedPrice: 0,
          useStock: false,
          category_id: "",
          unitNameId: "",
          itemImage: null,
          pinned: false,
          pinnedTime: null,
          expiredDate: null,
          unitPriceVariants: [],
          barcode: null,
          editedDate: new Date()
        })
      ];
    }
  }

  async getItems(): Promise<Item[]> {
    if (navigator.onLine) {
      const data = await this.readItemBucket();
      this.itemLocalService.saveItems(data);
      return data;
    } else {
      return this.itemLocalService.getItems();
    }
  }

  async getItem(itemId: string): Promise<Item | undefined> {
    if (navigator.onLine) {
      const data = await this.readItemBucket();
      const matched = data.find((item) => item.item_id == itemId);
      return matched;
    } else {
      const savedOfflineItems = await this.itemLocalService.getItems();
      return savedOfflineItems.find((item) => item.item_id == itemId);
    }
  }

  async addItem(item: Item): Promise<boolean> {
    if (noConnection()) return false;
    const data = await this.readItemBucket();
    data.push(item);
    await this.writeItemBucket(data);
    return true;
  }

  async updateItem(item: Item): Promise<boolean> {
    if (navigator.onLine) {
      const data = await this.readItemBucket();
      const filtered = data.filter((element) => element.item_id !== item.item_id);
      filtered.push(item);
      await this.writeItemBucket(filtered);
      return true;
    } else {
      await this.itemLocalService.updateItem(item);
      return true;
    }
  }
  async deleteItem(itemId: string) {
    if (navigator.onLine) {
      const data = await this.readItemBucket();
      const filtered = data.filter((element) => element.item_id !== itemId);
      await this.writeItemBucket(filtered);
    } else {
      await this.itemLocalService.deleteItem(itemId);
    }
  }

  async saveItems(items: Item[]) {
    if (navigator.onLine) {
      this.writeItemBucket(items);
    } else {
      await this.itemLocalService.saveItems(items);
    }
  }

  async clearItems() {
    if (navigator.onLine) {
      await this.saveItems([]);
    } else {
      await this.itemLocalService.clearItems();
    }
  }
}

export default ItemNetworkService;
