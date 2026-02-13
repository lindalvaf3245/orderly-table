import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Package, CreditCard, Banknote } from 'lucide-react';
import { PixIcon } from '@/components/icons/PixIcon';
import { Order, PaymentMethod } from '@/types/restaurant';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Period = 'week' | 'month' | 'all';

const PIE_COLORS = [
  'hsl(25, 95%, 50%)',   // primary
  'hsl(142, 70%, 45%)',  // success/accent
  'hsl(220, 70%, 55%)',  // blue
  'hsl(0, 84%, 60%)',    // destructive
  'hsl(45, 93%, 47%)',   // warning
  'hsl(280, 60%, 55%)',  // purple
  'hsl(180, 60%, 45%)',  // teal
];

function getFilteredOrders(orders: Order[], period: Period): Order[] {
  const now = new Date();
  const paid = orders.filter(o => o.status === 'paid');

  if (period === 'all') return paid;

  const cutoff = new Date();
  if (period === 'week') cutoff.setDate(now.getDate() - 7);
  else if (period === 'month') cutoff.setDate(now.getDate() - 30);

  return paid.filter(o => new Date(o.closedAt || o.openedAt) >= cutoff);
}

function getDailySalesData(orders: Order[]) {
  const byDate: Record<string, number> = {};

  orders.forEach(order => {
    const date = new Date(order.closedAt || order.openedAt).toLocaleDateString('pt-BR');
    byDate[date] = (byDate[date] || 0) + order.total;
  });

  return Object.entries(byDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => {
      const da = new Date(a.date.split('/').reverse().join('-'));
      const db = new Date(b.date.split('/').reverse().join('-'));
      return da.getTime() - db.getTime();
    });
}

function getPaymentMethodData(orders: Order[]) {
  const totals: Record<string, number> = { cash: 0, pix: 0, card: 0 };

  orders.forEach(order => {
    // Partial payments
    (order.partialPayments || []).forEach(p => {
      totals[p.method] = (totals[p.method] || 0) + p.amount;
    });
    // Final payment
    if (order.paymentMethod) {
      const partialTotal = (order.partialPayments || []).reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, order.total - partialTotal);
      totals[order.paymentMethod] = (totals[order.paymentMethod] || 0) + remaining;
    }
  });

  const labels: Record<string, string> = { cash: 'Espécie', pix: 'Pix', card: 'Cartão' };

  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([method, total]) => ({
      name: labels[method] || method,
      value: total,
      method,
    }));
}

function getProductData(orders: Order[]) {
  const products: Record<string, { quantity: number; total: number }> = {};

  orders.forEach(order => {
    order.items
      .filter(i => !i.cancelled)
      .forEach(item => {
        if (!products[item.productName]) products[item.productName] = { quantity: 0, total: 0 };
        products[item.productName].quantity += item.quantity;
        products[item.productName].total += item.total;
      });
  });

  return Object.entries(products)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
}

const salesChartConfig: ChartConfig = {
  total: { label: 'Vendas', color: 'hsl(25, 95%, 50%)' },
};

const paymentChartConfig: ChartConfig = {
  cash: { label: 'Espécie', color: PIE_COLORS[0] },
  pix: { label: 'Pix', color: PIE_COLORS[1] },
  card: { label: 'Cartão', color: PIE_COLORS[2] },
};

const productChartConfig: ChartConfig = {
  total: { label: 'Total', color: 'hsl(142, 70%, 45%)' },
  quantity: { label: 'Quantidade', color: 'hsl(25, 95%, 50%)' },
};

export function AnalyticsSection() {
  const { orderHistory } = useOrders();
  const [period, setPeriod] = useState<Period>('week');

  const filteredOrders = useMemo(() => getFilteredOrders(orderHistory, period), [orderHistory, period]);
  const dailySales = useMemo(() => getDailySalesData(filteredOrders), [filteredOrders]);
  const paymentData = useMemo(() => getPaymentMethodData(filteredOrders), [filteredOrders]);
  const productData = useMemo(() => getProductData(filteredOrders), [filteredOrders]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const periodLabels: Record<Period, string> = {
    week: 'Últimos 7 dias',
    month: 'Últimos 30 dias',
    all: 'Todo o período',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">{periodLabels[period]}</p>
        </div>
        <div className="flex gap-1">
          {(['week', 'month', 'all'] as Period[]).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? '7d' : p === 'month' ? '30d' : 'Tudo'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faturamento</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comandas pagas</p>
              <p className="text-xl font-bold text-foreground">{totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-warning/15 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(avgTicket)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Sem dados para o período</h3>
            <p className="text-muted-foreground mt-1">Finalize comandas para ver os gráficos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vendas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {paymentData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-sm">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={productChartConfig} className="h-[250px] w-full">
                <BarChart data={productData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          name === 'total' ? formatCurrency(Number(value)) : `${value}x`
                        }
                      />
                    }
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Product Ranking Table */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ranking de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center text-xs font-semibold text-muted-foreground px-2 py-1">
                  <span className="w-8">#</span>
                  <span className="flex-1">Produto</span>
                  <span className="w-16 text-right">Qtd</span>
                  <span className="w-24 text-right">Total</span>
                </div>
                {productData.map((product, idx) => (
                  <div key={product.name} className="flex items-center text-sm px-2 py-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="w-8 font-bold text-muted-foreground">{idx + 1}</span>
                    <span className="flex-1 font-medium truncate">{product.name}</span>
                    <span className="w-16 text-right text-muted-foreground">{product.quantity}x</span>
                    <span className="w-24 text-right font-medium">{formatCurrency(product.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
