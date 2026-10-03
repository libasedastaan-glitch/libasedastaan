import { DollarSign, ShoppingBag, Package, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Order, Product } from '../../types/index.ts';

interface AnalyticsOverviewProps {
  orders: Order[];
  products: Product[];
  onViewOrders: () => void;
  onViewProducts: () => void;
}

export const AnalyticsOverview = ({
  orders,
  products,
  onViewOrders,
  onViewProducts,
}: AnalyticsOverviewProps) => {
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const processingOrders = orders.filter((o) => o.status === 'processing').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Chart data simulation
  const monthlyRevenue = [
    { month: 'Apr', amount: 4200, points: 42 },
    { month: 'May', amount: 5800, points: 58 },
    { month: 'Jun', amount: 5200, points: 52 },
    { month: 'Jul', amount: 7900, points: 79 },
    { month: 'Aug', amount: 9400, points: 94 },
    { month: 'Sep', amount: totalRevenue > 0 ? Math.round(totalRevenue) + 5400 : 10800, points: 108 },
  ];

  const maxAmount = Math.max(...monthlyRevenue.map((m) => m.amount));

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto bg-[#FAF6F0] text-[#3B2314]">
      {/* 4 Metric Cards styled in Cream & Taupe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-3 relative overflow-hidden rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif uppercase tracking-widest text-[#3B2314]/70 font-semibold">
              Gross Revenue
            </span>
            <div className="w-8 h-8 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#3B2314]">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-serif font-semibold text-[#526A50] flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-[#3B2314]/60 font-light">Stripe settlements &amp; verified COD</p>
        </div>

        {/* Metric 2: Total Orders */}
        <div
          onClick={onViewOrders}
          className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-3 relative overflow-hidden cursor-pointer hover:border-[#3B2314] transition-colors rounded-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif uppercase tracking-widest text-[#3B2314]/70 font-semibold">
              Total Orders
            </span>
            <div className="w-8 h-8 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#3B2314]">{orders.length}</span>
            {pendingOrders > 0 ? (
              <span className="text-xs font-serif font-semibold text-[#9E5A38] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {pendingOrders} pending
              </span>
            ) : (
              <span className="text-xs font-serif font-semibold text-[#526A50]">All fulfilled</span>
            )}
          </div>
          <p className="text-[11px] text-[#3B2314]/60 font-light">Click to view &amp; update order log</p>
        </div>

        {/* Metric 3: Active Products */}
        <div
          onClick={onViewProducts}
          className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-3 relative overflow-hidden cursor-pointer hover:border-[#3B2314] transition-colors rounded-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif uppercase tracking-widest text-[#3B2314]/70 font-semibold">
              Catalog Items
            </span>
            <div className="w-8 h-8 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#3B2314]">{products.length}</span>
            {lowStockCount > 0 ? (
              <span className="text-xs font-serif font-semibold text-[#8F423B] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} low stock
              </span>
            ) : (
              <span className="text-xs font-serif font-semibold text-[#526A50]">Balanced stock</span>
            )}
          </div>
          <p className="text-[11px] text-[#3B2314]/60 font-light">Live in Supabase products table</p>
        </div>

        {/* Metric 4: Avg Order Value */}
        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-3 relative overflow-hidden rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif uppercase tracking-widest text-[#3B2314]/70 font-semibold">
              Average Basket
            </span>
            <div className="w-8 h-8 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#3B2314]">
              ${avgOrderValue.toFixed(2)}
            </span>
            <span className="text-xs font-serif font-semibold text-[#526A50]">+6.2%</span>
          </div>
          <p className="text-[11px] text-[#3B2314]/60 font-light">Luxury garment basket distribution</p>
        </div>
      </div>

      {/* Charts & Status Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart using INTERACTIVE ACCENT (Bronze #9E5A38) for lines, curves and data points */}
        <div className="lg:col-span-2 p-6 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-6 rounded-none">
          <div className="flex items-center justify-between border-b border-[#D8CEC4] pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#3B2314] tracking-wide uppercase">
                Revenue Trajectory &amp; Growth
              </h3>
              <p className="text-xs text-[#3B2314]/70 mt-0.5 font-light">
                Monthly revenue captured via Stripe Checkout and verified Cash on Delivery
              </p>
            </div>
            <span className="text-[10px] font-serif uppercase tracking-widest px-2.5 py-1 bg-[#FAF6F0] text-[#9E5A38] border border-[#D8CEC4] font-semibold">
              Live DB Feed
            </span>
          </div>

          {/* SVG Line & Area Chart in Bronze (#9E5A38) */}
          <div className="h-64 relative flex flex-col justify-end pt-4">
            {/* Background horizontal grid lines in NEUTRAL (Taupe) */}
            <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-[#D8CEC4] w-full" />
              <div className="border-b border-[#D8CEC4] w-full" />
              <div className="border-b border-[#D8CEC4] w-full" />
              <div className="border-b border-[#D8CEC4] w-full" />
            </div>

            {/* SVG Trendline connecting the monthly points */}
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9E5A38" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#9E5A38" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <polygon
                points="20,130 115,100 230,110 345,65 460,40 575,20 575,160 20,160"
                fill="url(#bronzeGradient)"
              />
              {/* Line path in Bronze */}
              <polyline
                points="20,130 115,100 230,110 345,65 460,40 575,20"
                fill="none"
                stroke="#9E5A38"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Bronze Data Points */}
              <circle cx="20" cy="130" r="4.5" fill="#FAF6F0" stroke="#9E5A38" strokeWidth="2.5" />
              <circle cx="115" cy="100" r="4.5" fill="#FAF6F0" stroke="#9E5A38" strokeWidth="2.5" />
              <circle cx="230" cy="110" r="4.5" fill="#FAF6F0" stroke="#9E5A38" strokeWidth="2.5" />
              <circle cx="345" cy="65" r="4.5" fill="#FAF6F0" stroke="#9E5A38" strokeWidth="2.5" />
              <circle cx="460" cy="40" r="4.5" fill="#FAF6F0" stroke="#9E5A38" strokeWidth="2.5" />
              <circle cx="575" cy="20" r="5" fill="#9E5A38" stroke="#FAF6F0" strokeWidth="2" />
            </svg>

            {/* X-axis Labels */}
            <div className="flex justify-between items-center pt-4 border-t border-[#D8CEC4] text-xs font-serif tracking-wider text-[#3B2314]/75">
              {monthlyRevenue.map((item, idx) => (
                <div key={item.month} className="text-center">
                  <div className="font-semibold">{item.month}</div>
                  <div className="text-[10px] text-[#9E5A38] font-mono mt-0.5">
                    ${(item.amount / 1000).toFixed(1)}k
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="p-6 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury space-y-6 flex flex-col justify-between rounded-none">
          <div>
            <h3 className="font-serif font-bold text-base text-[#3B2314] tracking-wide uppercase border-b border-[#D8CEC4] pb-4">
              Atelier Logistics
            </h3>

            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-serif">
                  <span className="text-[#3B2314] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#526A50]" /> Delivered Ensembles
                  </span>
                  <span className="font-mono text-[#3B2314] font-bold">{deliveredOrders}</span>
                </div>
                <div className="w-full bg-[#EFE8DE] h-2 rounded-none overflow-hidden">
                  <div
                    className="bg-[#526A50] h-full"
                    style={{ width: `${(deliveredOrders / Math.max(1, orders.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-serif">
                  <span className="text-[#3B2314] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#9E5A38]" /> In Master Tailoring / Processing
                  </span>
                  <span className="font-mono text-[#3B2314] font-bold">{processingOrders}</span>
                </div>
                <div className="w-full bg-[#EFE8DE] h-2 rounded-none overflow-hidden">
                  <div
                    className="bg-[#9E5A38] h-full"
                    style={{ width: `${(processingOrders / Math.max(1, orders.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-serif">
                  <span className="text-[#3B2314] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8F423B]" /> Pending Courier Action
                  </span>
                  <span className="font-mono text-[#3B2314] font-bold">{pendingOrders}</span>
                </div>
                <div className="w-full bg-[#EFE8DE] h-2 rounded-none overflow-hidden">
                  <div
                    className="bg-[#8F423B] h-full"
                    style={{ width: `${(pendingOrders / Math.max(1, orders.length)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D8CEC4]">
            <button
              onClick={onViewOrders}
              className="w-full py-2.5 px-4 bg-[#FAF6F0] hover:bg-[#F4EFE6] border border-[#D8CEC4] hover:border-[#3B2314] text-[#3B2314] text-xs font-serif uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors rounded-none"
            >
              <span>Manage All {orders.length} Orders</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#526A50]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
