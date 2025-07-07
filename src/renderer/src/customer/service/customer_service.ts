import { offlineMode } from "@renderer/utils/app_constants";
import CustomerLocalService from "./customer_local_service";
import CustomerNetworkService from "./customer_network_service";
import { Customer } from "../interface/customer";
import CustomerImageService from "./customer_image_local_service";

class CustomerService {
  static service = offlineMode ? new CustomerLocalService() : new CustomerNetworkService();
  static async getCustomers(): Promise<Customer[]> {
    return await this.service.getCustomers();
  }

  static async getCustomer(customerId: string): Promise<Customer | undefined> {
    return await this.service.getCustomer(customerId);
  }

  static async addCustomer(customer: Customer): Promise<boolean> {
    return await this.service.addCustomer(customer);
  }

  static async updateCustomer(customer: Customer): Promise<boolean> {
    return await this.service.updateCustomer(customer);
  }
  static async deleteCustomer(customerId: string) {
    await this.service.deleteCustomer(customerId);
    await CustomerImageService.deleteImage(customerId);
  }
  static async clearCustomer() {
    await this.service.clearCustomer();
  }
}

export default CustomerService;
