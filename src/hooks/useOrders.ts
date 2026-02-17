import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Order, OrderItem, OrderStatus, PaymentMethod, PartialPayment } from '@/types/restaurant';

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

  const calculateOrderTotal = (items: OrderItem[], discount: number = 0): number => {
    const subtotal = items
      .filter((item) => !item.cancelled)
      .reduce((sum, item) => sum + item.total, 0);
    return Math.max(0, subtotal - discount);
  };

  const addItemToOrder = useCallback(
    (orderId: string, productId: string, productName: string, quantity: number, unitPrice: number) => {
      setOpenOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          // Stack: find existing non-cancelled item with same product
          const existingIndex = order.items.findIndex(
            (item) => item.productId === productId && !item.cancelled
          );

          let updatedItems: OrderItem[];
          if (existingIndex >= 0) {
            updatedItems = order.items.map((item, idx) => {
              if (idx !== existingIndex) return item;
              const newQty = item.quantity + quantity;
              return { ...item, quantity: newQty, total: newQty * item.unitPrice };
            });
          } else {
            const newItem: OrderItem = {
              id: crypto.randomUUID(),
              productId,
              productName,
              quantity,
              unitPrice,
              total: quantity * unitPrice,
              cancelled: false,
            };
            updatedItems = [...order.items, newItem];
          }

          return {
            ...order,
            items: updatedItems,
            total: calculateOrderTotal(updatedItems, order.discount),
          };
        })
      );
    },
    [setOpenOrders]
  );

  const cancelItem = useCallback((orderId: string, itemId: string, cancelQuantity?: number) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        let updatedItems: OrderItem[];
        const item = order.items.find((i) => i.id === itemId);
        if (!item) return order;

        if (cancelQuantity && cancelQuantity < item.quantity) {
          // Split: reduce original, create cancelled portion
          updatedItems = order.items.flatMap((i) => {
            if (i.id !== itemId) return [i];
            const remaining = i.quantity - cancelQuantity;
            return [
              { ...i, quantity: remaining, total: remaining * i.unitPrice },
              {
                ...i,
                id: crypto.randomUUID(),
                quantity: cancelQuantity,
                total: cancelQuantity * i.unitPrice,
                cancelled: true,
              },
            ];
          });
        } else {
          updatedItems = order.items.map((i) =>
            i.id === itemId ? { ...i, cancelled: true } : i
          );
        }

        return {
          ...order,
          items: updatedItems,
          total: calculateOrderTotal(updatedItems, order.discount),
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
          total: calculateOrderTotal(updatedItems, order.discount),
        };
      })
    );
  }, [setOpenOrders]);

  const finalizeOrder = useCallback((orderId: string, status: 'paid' | 'cancelled', paymentMethod?: PaymentMethod) => {
    const order = openOrders.find((o) => o.id === orderId);
    if (!order) return;

    const finalizedOrder: Order = {
      ...order,
      status,
      closedAt: new Date().toISOString(),
      paymentMethod,
    };

    setOrderHistory((prev) => [finalizedOrder, ...prev]);
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, [openOrders, setOpenOrders, setOrderHistory]);

  const cancelOrder = useCallback((orderId: string) => {
    finalizeOrder(orderId, 'cancelled');
  }, [finalizeOrder]);

  const payOrder = useCallback((orderId: string, paymentMethod: PaymentMethod) => {
    finalizeOrder(orderId, 'paid', paymentMethod);
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

  const deleteFromHistory = useCallback((orderId: string) => {
    setOrderHistory((prev) => prev.filter((o) => o.id !== orderId));
  }, [setOrderHistory]);

  const addPartialPayment = useCallback((orderId: string, amount: number, method: PaymentMethod) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const payment: PartialPayment = {
          id: crypto.randomUUID(),
          amount,
          method,
          paidAt: new Date().toISOString(),
        };
        const partialPayments = [...(order.partialPayments || []), payment];
        return { ...order, partialPayments };
      })
    );
  }, [setOpenOrders]);

  const removePartialPayment = useCallback((orderId: string, paymentId: string) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          partialPayments: (order.partialPayments || []).filter((p) => p.id !== paymentId),
        };
      })
    );
  }, [setOpenOrders]);

  const getOrderRemainingBalance = useCallback((order: Order): number => {
    const paid = (order.partialPayments || []).reduce((s, p) => s + p.amount, 0);
    return Math.max(0, order.total - paid);
  }, []);

  const setOrderDiscount = useCallback((orderId: string, discount: number) => {
    setOpenOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newDiscount = Math.max(0, discount);
        return {
          ...order,
          discount: newDiscount,
          total: calculateOrderTotal(order.items, newDiscount),
        };
      })
    );
  }, [setOpenOrders]);

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
    deleteFromHistory,
    addPartialPayment,
    removePartialPayment,
    getOrderRemainingBalance,
    setOrderDiscount,
  };
}
