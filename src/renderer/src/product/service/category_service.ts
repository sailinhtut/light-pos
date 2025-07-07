import { offlineMode } from "@renderer/utils/app_constants";
import { Category } from "../interface/category";
import CategoryLocalService from "./category_local_service";
import CategoryNetworkService from "./category_network_service";

class CategoryService {
  static service = offlineMode ? new CategoryLocalService() : new CategoryNetworkService();
  static async getCategories(): Promise<Category[]> {
    return await this.service.getCategories();
  }

  static async getCategory(categoryId: string): Promise<Category | undefined> {
    return await this.service.getCategory(categoryId);
  }
  static async addCategory(category: Category): Promise<boolean> {
    return await this.service.addCategory(category);
  }

  static async updateCategory(category: Category): Promise<boolean> {
    return await this.service.updateCategory(category);
  }
  static async deleteCategory(categoryId: string) {
    await this.service.deleteCategory(categoryId);
  }
  static async clearCategory() {
    await this.service.clearCategory();
  }
}

export default CategoryService;
