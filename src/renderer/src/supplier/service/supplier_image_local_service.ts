import Dexie, { Table } from "dexie";

// Define your database class
class SupplierImageDatabase extends Dexie {
  images!: Table<{ supplierId: string; images: string[] }, string>;

  constructor() {
    super("supplier_image");
    this.version(1).stores({
      images: "supplierId"
    });
  }
}

// Define your service class
class SupplierImageService {
  static db = new SupplierImageDatabase().images;

  // Get an image by itemId
  static async getImage(supplierId: string): Promise<string[]> {
    const data = await this.db.get(supplierId);
    return data ? data.images : [];
  }

  // Add a new image
  static async addImage(supplierId: string, images: string[]) {
    await this.db.put({ supplierId, images });
  }

  // Update an existing image
  static async updateImage(supplierId: string, images: string[]) {
    await this.db.put({ supplierId, images });
  }

  // Delete an image by supplierId
  static async deleteImage(supplierId: string) {
    await this.db.delete(supplierId);
  }

  // Clear all images
  static async clearImages() {
    await this.db.clear();
  }
}

export default SupplierImageService;
