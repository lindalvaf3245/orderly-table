import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Order, OrderItem, OrderStatus } from '@/types/restaurant';

const OPEN_ORDERS_KEY = 'restaurant_open_orders';
const ORDER_HISTORY_KEY = 'restaurant_order_history';

export function useOrders() {
  const [openOrders, setOpenOrders] = useLocalStorage<Order[]>(OPEN_ORDERS_KEY, []);
  const [orderHistory, setOrderHistory] = useLocalStorage<Order[]>(ORDER_HISTORY_KEY, []);

  const createOrder = useCallback((name: string) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      name: name.trim(),
      openedAt: new Date().toISOString(),
      items: [],
      status: 'open',
      total: 0,
    };
    setOpenOrders((prev) => [...prev, newOrder]);
    return newOrder;
  }, [setOpenOrders]);

  const calculateOrderTotal = (items: OrderItem[]): number => {
    return items
      .filter((item) => !item.cancelled)
      .reduce((sum, item) => sum + item.total, 0);
  };

  const addItemToOrder = useCallback(
    (orderId: string, productId: string, productName: string, quantity: number, unitPrice: number) => {
      setOpenOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          const newItem: OrderItem = {
            id: crypto.randomUUID(),
            productId,
            productName,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            cancelled: false,
          };

          const updatedItems = [...order.items, newItem];
          return {
            ...order,
            items: updatedItems,
            total: calculateOrderTotal(updatedItems),
          };
        })
      );
    },
    [setOpenOrders]
  );

  const cancelItem = useCallback((orderId: string, itemId: string) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.map((item) =>
          item.id === itemId ? { ...item, cancelled: true } : item
        );

        return {
          ...order,
          items: updatedItems,
          total: calculateOrderTotal(updatedItems),
        };
      })
    );
  }, [setOpenOrders]);

  const removeItem = useCallback((orderId: string, itemId: string) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.filter((item) => item.id !== itemId);

        return {
          ...order,
          items: updatedItems,
          total: calculateOrderTotal(updatedItems),
        };
      })
    );
  }, [setOpenOrders]);

  const finalizeOrder = useCallback((orderId: string, status: 'paid' | 'cancelled') => {
    const order = openOrders.find((o) => o.id === orderId);
    if (!order) return;

    const finalizedOrder: Order = {
      ...order,
      status,
      closedAt: new Date().toISOString(),
    };

    setOrderHistory((prev) => [finalizedOrder, ...prev]);
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, [openOrders, setOpenOrders, setOrderHistory]);

  const cancelOrder = useCallback((orderId: string) => {
    finalizeOrder(orderId, 'cancelled');
  }, [finalizeOrder]);

  const payOrder = useCallback((orderId: string) => {
    finalizeOrder(orderId, 'paid');
  }, [finalizeOrder]);

  const getOrder = useCallback((orderId: string) => {
    return openOrders.find((o) => o.id === orderId);
  }, [openOrders]);

  const getTodayTotal = useCallback(() => {
    const today = new Date().toDateString();
    return orderHistory
      .filter((order) => {
        const orderDate = new Date(order.closedAt || order.openedAt).toDateString();
        return orderDate === today && order.status === 'paid';
      })
      .reduce((sum, order) => sum + order.total, 0);
  }, [orderHistory]);

  return {
    openOrders,
    orderHistory,
    createOrder,
    addItemToOrder,
    cancelItem,
    removeItem,
    cancelOrder,
    payOrder,
    getOrder,
    getTodayTotal,
  };
}
