import Dexie, { Table } from "dexie";
import { Supplier, decodeSupplierJson } from "../interface/supplier";

class SupplierDatabase extends Dexie {
  suppliers!: Table<Supplier, string>;
  constructor() {
    super("supplier_data");
    this.version(1).stores({
      suppliers:
        "supplierId,name,note,phoneOne,itemName,amount,quantity,payAmount,leftAmount,created_at,updated_at,attachments"
    });
  }
}

class SupplierLocalService {
  db = new SupplierDatabase();

  async getSuppliers(): Promise<Supplier[]> {
    const data = await this.db.suppliers.toArray();
    const decoded = data.map((element) => decodeSupplierJson(element));
    return decoded;
  }

  async getSupplier(supplierId: string): Promise<Supplier | undefined> {
    const data = await this.db.suppliers.get(supplierId);
    return data;
  }

  async saveSuppliers(suppliers: Supplier[]) {
    await this.clearSupplier();
    suppliers.forEach(async (e) => {
      await this.db.suppliers.add(e, e.supplierId);
    });
  }

  async addSupplier(supplier: Supplier): Promise<boolean> {
    await this.db.suppliers.add(supplier, supplier.supplierId);
    return true;
  }

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    await this.db.suppliers.update(supplier.supplierId, { ...supplier });
    return true;
  }
  async deleteSupplier(supplierId: string) {
    await this.db.suppliers.delete(supplierId);
  }

  async clearSupplier() {
    await this.db.suppliers.clear();
  }
}

export default SupplierLocalService;
