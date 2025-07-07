import Dexie, { Table } from "dexie";
import { Customer, decodeCustomerJson } from "../interface/customer";

class CustomerDatabase extends Dexie {
  customers!: Table<Customer, string>;
  constructor() {
    super("customer_data");
    this.version(1).stores({
      customers: "customerId,name,note,phoneOne,phoneTwo,created_at,updated_at,attachments"
    });
  }
}

class CustomerLocalService {
  db = new CustomerDatabase();

  async getCustomers(): Promise<Customer[]> {
    const data = await this.db.customers.toArray();
    const decoded = data.map((element) => decodeCustomerJson(element));
    return decoded;
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    const data = await this.db.customers.get(customerId);
    return data;
  }

  async saveCustomers(customers: Customer[]) {
    await this.clearCustomer();
    customers.forEach(async (e) => {
      await this.db.customers.add(e, e.customerId);
    });
  }

  async addCustomer(customer: Customer): Promise<boolean> {
    await this.db.customers.add(customer, customer.customerId);
    return true;
  }

  async updateCustomer(customer: Customer): Promise<boolean> {
    await this.db.customers.update(customer.customerId, { ...customer });
    return true;
  }

  async deleteCustomer(customerId: string) {
    await this.db.customers.delete(customerId);
  }

  async clearCustomer() {
    await this.db.customers.clear();
  }
}

export default CustomerLocalService;
