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

export interface Order {
  id: string;
  name: string;
  openedAt: string;
  closedAt?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  orderCount: number;
}
