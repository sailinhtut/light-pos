import { convertTo12HourFormat } from "@renderer/utils/general_utils";
import { OrderHistory } from "../interface/order_history";
import moment from "moment";

export function formatOrderTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const period = isPM ? "PM" : "AM";

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${formattedHours}:${formattedMinutes} ${period} ${month} ${day} ${year}`;
}

export function groupOrdersByHour(orders: OrderHistory[]) {
  const data: { name: string; quantity: number }[] = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < orders.length; j++) {
      const order = orders[j];
      if (i === order.date.getHours()) {
        const matched =
          data.length > 0 ? data.find((e) => e.name === convertTo12HourFormat(i)) : undefined;
        if (matched) {
          matched.quantity++;
        } else {
          data.push({ name: convertTo12HourFormat(i), quantity: 1 });
        }
      }
    }
  }

  return data;
}

export function groupOrdersByDate(orders: OrderHistory[]) {
  const data: { name: string; quantity: number }[] = [];
  for (let j = 0; j < orders.length; j++) {
    const order = orders[j];
    const formattedDate = moment(order.date).format("MMM DD y");
    const matched = data.length > 0 ? data.find((e) => e.name === formattedDate) : undefined;
    if (matched) {
      matched.quantity++;
    } else {
      data.push({ name: formattedDate, quantity: 1 });
    }
  }
  return data;
}

export function groupOrdersByCashier(orders: OrderHistory[]) {
  const data: { id: string; name: string; quantity: number; amount: number }[] = [];
  for (let j = 0; j < orders.length; j++) {
    const order = orders[j];
    const matched = data.length > 0 ? data.find((e) => e.id === `${order.casherId}`) : undefined;
    if (matched) {
      matched.name = order.casherName;
      matched.amount += order.calculateTotal();
      matched.quantity++;
    } else {
      data.push({
        id: order.casherId,
        name: `${order.casherName}`,
        quantity: 1,
        amount: order.calculateTotal()
      });
    }
  }

  return data;
}

export function groupOrdersByCustomer(orders: OrderHistory[]) {
  const data: { name: string; quantity: number; amount: number }[] = [];
  for (let j = 0; j < orders.length; j++) {
    const order = orders[j];
    if (order.customer.includes("Order") || order.customer === "") {
      const matched = data.length > 0 ? data.find((e) => e.name === "Other") : undefined;
      if (matched) {
        matched.quantity++;
        matched.amount += order.calculateTotal();
      } else {
        data.push({ name: `Other`, quantity: 1, amount: order.calculateTotal() });
      }
    } else {
      const matched =
        data.length > 0 ? data.find((e) => e.name === `${order.customer}`) : undefined;
      if (matched) {
        matched.name = order.customer;
        matched.quantity++;
        matched.amount += order.calculateTotal();
      } else {
        data.push({ name: `${order.customer}`, quantity: 1, amount: order.calculateTotal() });
      }
    }
  }

  return data.map((e) => {
    return { id: e.name, name: e.name, quantity: e.quantity, amount: e.amount };
  });
}

export function groupOrdersByCartItem(orders: OrderHistory[]) {
  const data: { id: string; name: string; quantity: number; amount: number }[] = [];
  for (let j = 0; j < orders.length; j++) {
    const order = orders[j];
    for (let item of order.orders) {
      const matched = data.length > 0 ? data.find((e) => e.id === `${item.itemId}`) : undefined;
      if (matched) {
        matched.name = item.itemName;
        matched.quantity += item.quantity;
        matched.amount += item.getTotal();
      } else {
        data.push({
          id: item.itemId,
          name: `${item.itemName}`,
          quantity: item.quantity,
          amount: item.getTotal()
        });
      }
    }
  }

  return data;
}

export function isSingleDayOrders(orders: OrderHistory[]): boolean {
  const filtered: number[] = [];

  if (orders.length === 0) return true;

  for (let order of orders) {
    const matched = filtered.find((e) => e === order.date.getDate());
    if (!matched) filtered.push(order.date.getDate());
  }
  return filtered.length === 1;
}
