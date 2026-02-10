// Restaurant Management Types

export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cancelled: boolean;
}

export type OrderStatus = 'open' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'pix' | 'card';

export interface PartialPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
}

export interface Order {
  id: string;
  name: string;
  openedAt: string;
  closedAt?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  paymentMethod?: PaymentMethod;
  partialPayments?: PartialPayment[];
}

export interface DailySummary {
  date: string;
  totalSales: number;
  orderCount: number;
}
