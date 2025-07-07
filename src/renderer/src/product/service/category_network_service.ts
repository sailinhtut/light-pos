import { firebaseFirestore } from "@renderer/firebase";
import { Category, decodeCategoryJson, encodeCategoryJson } from "../interface/category";
import { firebaseCollectionRemove } from "@renderer/app/view/clear_data_page";
import { noConnection } from "@renderer/utils/general_utils";
import CategoryLocalService from "./category_local_service";

class CategoryNetworkService {
  categoryCollection = "categories";
  categoryLocalService = new CategoryLocalService();

  async getCategories(): Promise<Category[]> {
    if (navigator.onLine) {
      const snap = await firebaseFirestore.collection(this.categoryCollection).get();
      if (snap.docs.length > 0) {
        const data = snap.docs.map((docSnap) => decodeCategoryJson(docSnap.data()));
        await this.categoryLocalService.saveCategories(data);
        return data;
      }
      return [];
    } else {
      return await this.categoryLocalService.getCategories();
    }
  }

  async getCategory(categoryId: string): Promise<Category | undefined> {
    if (navigator.onLine) {
      const docSnap = await firebaseFirestore
        .collection(this.categoryCollection)
        .doc(categoryId)
        .get();
      if (docSnap.exists && docSnap.data()) {
        const data = decodeCategoryJson(docSnap.data()!);
        return data;
      }
      return undefined;
    } else {
      const savedOfflineCategories = await this.categoryLocalService.getCategories();
      return savedOfflineCategories.find((e) => e.category_id === categoryId);
    }
  }

  async addCategory(category: Category): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.categoryCollection)
      .doc(category.category_id)
      .set(encodeCategoryJson(category));
    return true;
  }

  async updateCategory(category: Category): Promise<boolean> {
    if (noConnection()) return false;
    await firebaseFirestore
      .collection(this.categoryCollection)
      .doc(category.category_id)
      .update(encodeCategoryJson(category));
    return true;
  }
  async deleteCategory(categoryId: string) {
    if (noConnection()) return;
    await firebaseFirestore.collection(this.categoryCollection).doc(categoryId).delete();
  }

  async clearCategory() {
    if (noConnection()) return;
    await firebaseCollectionRemove(this.categoryCollection);
  }
}

export default CategoryNetworkService;
