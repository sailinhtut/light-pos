import Dexie, { Table } from "dexie";
import { Category, decodeCategoryJson } from "../interface/category";

class CaetgoryDatabase extends Dexie {
  categories!: Table<Category, string>;
  constructor() {
    super("category_data");
    this.version(1).stores({
      categories: "category_id,name"
    });
  }
}

class CategoryLocalService {
  db = new CaetgoryDatabase();

  async getCategories(): Promise<Category[]> {
    const data = await this.db.categories.toArray();
    const decoded = data.map((element) => decodeCategoryJson(element));
    return decoded;
  }

  async getCategory(categoryId: string): Promise<Category | undefined> {
    const data = await this.db.categories.get(categoryId);
    return data;
  }

  async saveCategories(categories: Category[]) {
    await this.clearCategory();
    categories.forEach(async (e) => {
      await this.updateCategory(e);
    });
  }

  async addCategory(category: Category): Promise<boolean> {
    await this.db.categories.add(category, category.category_id);
    return true;
  }

  async updateCategory(category: Category): Promise<boolean> {
    await this.db.categories.update(category.category_id, { ...category });
    return true;
  }
  async deleteCategory(categoryId: string) {
    await this.db.categories.delete(categoryId);
  }
  async clearCategory() {
    await this.db.categories.clear();
  }
}

export default CategoryLocalService;
