import Dexie, { Table } from "dexie";

// Define your database class
class ImageDatabase extends Dexie {
images!: Table<{ itemId: string; imageData: string }, string>;

constructor() {
  super("product_image");
  this.version(1).stores({
    images: "itemId" // Define itemId as the primary key
  });
}
}

// Define your service class
class ItemImageService {
static db = new ImageDatabase().images;

// Get all images
static async getImages(): Promise<string[]> {
  const data = await this.db.toArray();
  return data.map((record) => record.imageData);
}

// Get an image by itemId
static async getImage(itemId: string): Promise<string | undefined> {
  const data = await this.db.get(itemId);
  return data?.imageData;
}

// Add a new image
static async addImage(itemId: string, imageData: string) {
  await this.db.put({ itemId, imageData });
}

// Update an existing image
static async updateImage(itemId: string, imageData: string) {
  await this.db.put({ itemId, imageData });
}

// Delete an image by itemId
static async deleteImage(itemId: string) {
  await this.db.delete(itemId);
}

// Clear all images
static async clearImages() {
  await this.db.clear();
}
}

export default ItemImageService;