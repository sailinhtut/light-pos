export interface Customer {
  customerId: string;
  name: string;
  note: string;
  phoneOne: string;
  phoneTwo: string;
  created_at: Date;
  updated_at: Date;
  attachments: string[];
}

export function encodeCustomerJson(customer: Customer) {
  return {
    customerId: customer.customerId,
    name: customer.name,
    note: customer.note,
    phoneOne: customer.phoneOne,
    phoneTwo: customer.phoneTwo,
    created_at: customer.created_at.toISOString(),
    updated_at: customer.updated_at.toISOString(),
    attachments: customer.attachments
  };
}

export function decodeCustomerJson(json: object) {
  const data = json as Customer;
  return {
    customerId: data.customerId,
    name: data.name,
    note: data.note,
    phoneOne: data.phoneOne,
    phoneTwo: data.phoneTwo,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    attachments: data.attachments
  };
}
