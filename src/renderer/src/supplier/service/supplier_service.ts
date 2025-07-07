import { offlineMode } from "@renderer/utils/app_constants";
import SupplierLocalService from "./supplier_local_service";
import SupplierNetworkService from "./supplier_network_service";
import { Supplier } from "../interface/supplier";
import CustomerImageService from "@renderer/customer/service/customer_image_local_service";
import SupplierImageService from "./supplier_image_local_service";

class SupplierService {
  static service = offlineMode ? new SupplierLocalService() : new SupplierNetworkService();
  static async getSuppliers(): Promise<Supplier[]> {
    return await this.service.getSuppliers();
  }

  static async getSupplier(supplierId: string): Promise<Supplier | undefined> {
    return await this.service.getSupplier(supplierId);
  }

  static async addSupplier(supplier: Supplier): Promise<boolean> {
    return await this.service.addSupplier(supplier);
  }

  static async updateSupplier(supplier: Supplier): Promise<boolean> {
    return await this.service.updateSupplier(supplier);
  }
  static async deleteSupplier(supplierId: string) {
    await this.service.deleteSupplier(supplierId);
    await SupplierImageService.deleteImage(supplierId);
  }
  static async clearSupplier() {
    await this.service.clearSupplier();
  }
}

export default SupplierService;
