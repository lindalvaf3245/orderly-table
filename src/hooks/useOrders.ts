import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, PaymentMethod, PartialPayment } from '@/types/restaurant';

type DbOrder = {
  id: string;
  name: string;
  opened_at: string;
  closed_at: string | null;
  status: string;
  total: number;
  discount: number;
  payment_method: string | null;
  order_items: DbOrderItem[];
  partial_payments: DbPartialPayment[];
};

type DbOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  cancelled: boolean;
};

type DbPartialPayment = {
  id: string;
  amount: number;
  method: string;
  paid_at: string;
};

function mapOrder(o: DbOrder): Order {
  return {
    id: o.id,
    name: o.name,
    openedAt: o.opened_at,
    closedAt: o.closed_at || undefined,
    status: o.status as Order['status'],
    total: Number(o.total),
    discount: Number(o.discount) || undefined,
    paymentMethod: (o.payment_method as PaymentMethod) || undefined,
    items: (o.order_items || []).map((i) => ({
      id: i.id,
      productId: i.product_id || '',
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      total: Number(i.total),
      cancelled: i.cancelled,
    })),
    partialPayments: (o.partial_payments || []).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method as PaymentMethod,
      paidAt: p.paid_at,
    })),
  };
}

const ORDER_QUERY = '*, order_items(*), partial_payments(*)';

export function useOrders() {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data: openData } = await supabase
      .from('orders')
      .select(ORDER_QUERY)
      .eq('status', 'open')
      .order('opened_at', { ascending: true });

    const { data: historyData } = await supabase
      .from('orders')
      .select(ORDER_QUERY)
      .neq('status', 'open')
      .order('closed_at', { ascending: false });

    setOpenOrders((openData || []).map(mapOrder));
    setOrderHistory((historyData || []).map(mapOrder));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partial_payments' }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const calculateOrderTotal = (items: OrderItem[], discount: number = 0): number => {
    const subtotal = items.filter((i) => !i.cancelled).reduce((sum, i) => sum + i.total, 0);
    return Math.max(0, subtotal - discount);
  };

  const recalcAndUpdateTotal = async (orderId: string) => {
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    const { data: order } = await supabase.from('orders').select('discount').eq('id', orderId).maybeSingle();
    const discount = Number(order?.discount) || 0;
    const subtotal = (items || []).filter((i) => !i.cancelled).reduce((s, i) => s + Number(i.total), 0);
    const total = Math.max(0, subtotal - discount);
    await supabase.from('orders').update({ total }).eq('id', orderId);
  };

  const createOrder = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({ name: name.trim(), status: 'open', total: 0, discount: 0 })
      .select()
      .single();
    if (error || !data) { console.error(error); return null; }
    const newOrder: Order = { id: data.id, name: data.name, openedAt: data.opened_at, items: [], status: 'open', total: 0 };
    setOpenOrders((prev) => [...prev, newOrder]);
    return newOrder;
  }, []);

  const addItemToOrder = useCallback(async (orderId: string, productId: string, productName: string, quantity: number, unitPrice: number) => {
    // Check for existing non-cancelled item to stack
    const { data: existing } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .eq('cancelled', false)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      const newTotal = newQty * Number(existing.unit_price);
      await supabase.from('order_items').update({ quantity: newQty, total: newTotal }).eq('id', existing.id);
    } else {
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: productId,
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice,
      });
    }
    await recalcAndUpdateTotal(orderId);
    await fetchOrders();
  }, [fetchOrders]);

  const cancelItem = useCallback(async (orderId: string, itemId: string, cancelQuantity?: number) => {
    const { data: item } = await supabase.from('order_items').select('*').eq('id', itemId).maybeSingle();
    if (!item) return;

    if (cancelQuantity && cancelQuantity < item.quantity) {
      const remaining = item.quantity - cancelQuantity;
      await supabase.from('order_items').update({ quantity: remaining, total: remaining * Number(item.unit_price) }).eq('id', itemId);
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: cancelQuantity,
        unit_price: item.unit_price,
        total: cancelQuantity * Number(item.unit_price),
        cancelled: true,
      });
    } else {
      await supabase.from('order_items').update({ cancelled: true }).eq('id', itemId);
    }
    await recalcAndUpdateTotal(orderId);
    await fetchOrders();
  }, [fetchOrders]);

  const removeItem = useCallback(async (orderId: string, itemId: string) => {
    await supabase.from('order_items').delete().eq('id', itemId);
    await recalcAndUpdateTotal(orderId);
    await fetchOrders();
  }, [fetchOrders]);

  const finalizeOrder = useCallback(async (orderId: string, status: 'paid' | 'cancelled', paymentMethod?: PaymentMethod) => {
    await supabase.from('orders').update({
      status,
      closed_at: new Date().toISOString(),
      payment_method: paymentMethod || null,
    }).eq('id', orderId);
    await fetchOrders();
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    await finalizeOrder(orderId, 'cancelled');
  }, [finalizeOrder]);

  const payOrder = useCallback(async (orderId: string, paymentMethod: PaymentMethod) => {
    await finalizeOrder(orderId, 'paid', paymentMethod);
  }, [finalizeOrder]);

  const getOrder = useCallback((orderId: string) => {
    return openOrders.find((o) => o.id === orderId);
  }, [openOrders]);

  const getTodayTotal = useCallback(() => {
    const today = new Date().toDateString();
    return orderHistory
      .filter((o) => {
        const d = new Date(o.closedAt || o.openedAt).toDateString();
        return d === today && o.status === 'paid';
      })
      .reduce((sum, o) => sum + o.total, 0);
  }, [orderHistory]);

  const deleteFromHistory = useCallback(async (orderId: string) => {
    await supabase.from('orders').delete().eq('id', orderId);
    setOrderHistory((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const addPartialPayment = useCallback(async (orderId: string, amount: number, method: PaymentMethod) => {
    await supabase.from('partial_payments').insert({
      order_id: orderId,
      amount,
      method,
    });
    await fetchOrders();
  }, [fetchOrders]);

  const removePartialPayment = useCallback(async (orderId: string, paymentId: string) => {
    await supabase.from('partial_payments').delete().eq('id', paymentId);
    await fetchOrders();
  }, [fetchOrders]);

  const getOrderRemainingBalance = useCallback((order: Order): number => {
    const paid = (order.partialPayments || []).reduce((s, p) => s + p.amount, 0);
    return Math.max(0, order.total - paid);
  }, []);

  const setOrderDiscount = useCallback(async (orderId: string, discount: number) => {
    const d = Math.max(0, discount);
    await supabase.from('orders').update({ discount: d }).eq('id', orderId);
    await recalcAndUpdateTotal(orderId);
    await fetchOrders();
  }, [fetchOrders]);

  const renameOrder = useCallback(async (orderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await supabase.from('orders').update({ name: trimmed }).eq('id', orderId);
    await fetchOrders();
  }, [fetchOrders]);

  return {
    openOrders,
    orderHistory,
    loading,
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
    renameOrder,
  };
}
