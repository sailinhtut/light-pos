import Dexie, { Table } from "dexie";

// Define your database class
class CustomerImageDatabase extends Dexie {
  images!: Table<{ customerId: string; images: string[] }, string>;

  constructor() {
    super("customer_image");
    this.version(1).stores({
      images: "customerId"
    });
  }
}

// Define your service class
class CustomerImageService {
  static db = new CustomerImageDatabase().images;

  // Get an image by itemId
  static async getImage(customerId: string): Promise<string[]> {
    const data = await this.db.get(customerId);
    return data ? data.images : [];
  }

  // Add a new image
  static async addImage(customerId: string, images: string[]) {
    await this.db.put({ customerId, images });
  }

  // Update an existing image
  static async updateImage(customerId: string, images: string[]) {
    await this.db.put({ customerId, images });
  }

  // Delete an image by customerId
  static async deleteImage(customerId: string) {
    await this.db.delete(customerId);
  }

  // Clear all images
  static async clearImages() {
    await this.db.clear();
  }
}

export default CustomerImageService;
