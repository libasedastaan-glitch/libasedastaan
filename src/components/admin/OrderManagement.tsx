import { useState } from 'react';
import { Search, Eye, CheckCircle2, Clock, Truck, CreditCard, Banknote, MapPin, X } from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../../types/index.ts';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
}

export const OrderManagement = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
}: OrderManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.shipping_address.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.shipping_address.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto bg-[#FAF6F0] text-[#3B2314]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#3B2314] tracking-wider uppercase">
            Order Logistics &amp; Fulfillment
          </h2>
          <p className="text-xs text-[#3B2314]/70 mt-0.5 font-light">
            Process atelier fulfillment stages, verify Cash on Delivery collections, and inspect customer logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-serif uppercase tracking-wider px-3.5 py-2 bg-[#FFFDF9] border border-[#D8CEC4] text-[#3B2314] rounded-none">
            Total Orders: <strong className="text-[#9E5A38]">{orders.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
          <input
            type="text"
            placeholder="Search by order ID, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FFFDF9] border border-[#D8CEC4] pl-9 pr-4 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FFFDF9] border border-[#D8CEC4] px-4 py-2.5 text-xs font-serif uppercase tracking-wider text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none cursor-pointer"
        >
          <option value="all">All Statuses ({orders.length})</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="border border-[#D8CEC4] bg-[#FFFDF9] shadow-luxury overflow-hidden rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4EFE6] border-b border-[#D8CEC4] text-[#3B2314] font-serif uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D8CEC4]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#3B2314]/60 font-serif">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCod = order.payment_method === 'cod';
                  const isPaid = order.payment_status === 'paid';

                  return (
                    <tr key={order.id} className="hover:bg-[#F2ECE2] transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#3B2314] block">
                          #{order.id.slice(0, 10)}...
                        </span>
                        <span className="text-[10px] text-[#3B2314]/60 font-light">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-serif font-semibold text-[#3B2314] block">
                          {order.shipping_address.fullName}
                        </span>
                        <span className="text-[10px] text-[#3B2314]/60 font-light">
                          {order.shipping_address.city}, {order.shipping_address.country}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        {isCod ? (
                          <div className="flex items-center gap-1.5 font-serif text-xs text-[#9E5A38]">
                            <Banknote className="w-4 h-4" />
                            <span>Cash on Delivery</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-serif text-xs text-[#526A50]">
                            <CreditCard className="w-4 h-4" />
                            <span>Stripe Card</span>
                          </div>
                        )}
                      </td>

                      {/* Payment Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.payment_status}
                          onChange={(e) =>
                            onUpdatePaymentStatus(order.id, e.target.value as PaymentStatus)
                          }
                          className={`rounded-none px-2 py-1 text-[11px] font-serif uppercase tracking-wider font-semibold border focus:outline-none ${
                            isPaid
                              ? 'bg-[#EDF3EC] text-[#526A50] border-[#C3D5C0]'
                              : 'bg-[#FAF0EF] text-[#8F423B] border-[#E8C2BF]'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid &amp; Verified</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>

                      {/* Order Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="bg-[#FAF6F0] border border-[#D8CEC4] text-[#3B2314] rounded-none px-2.5 py-1 text-[11px] font-serif uppercase tracking-wider focus:outline-none focus:border-[#9E5A38]"
                        >
                          <option value="pending">Pending Courier</option>
                          <option value="processing">In Tailoring</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#3B2314]">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-[#3B2314]/70 hover:text-[#3B2314] hover:bg-[#FAF6F0] transition-colors rounded-none"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl p-6 space-y-6 rounded-none max-h-[90vh] overflow-y-auto text-[#3B2314]">
            <div className="flex items-center justify-between border-b border-[#D8CEC4] pb-4">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-[#9E5A38] font-bold">
                  Order Manifest
                </span>
                <h3 className="font-serif font-bold text-lg text-[#3B2314]">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-[#3B2314]/60 hover:text-[#3B2314] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client and Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FFFDF9] border border-[#D8CEC4]">
              <div>
                <h4 className="text-[10px] font-serif uppercase tracking-wider text-[#3B2314]/60 font-semibold mb-1">
                  Client Coordinates
                </h4>
                <p className="font-serif font-bold text-sm text-[#3B2314]">
                  {selectedOrder.shipping_address.fullName}
                </p>
                <p className="text-xs text-[#3B2314]/70 font-mono mt-0.5">
                  {selectedOrder.shipping_address.email}
                </p>
                <p className="text-xs text-[#3B2314]/70 mt-0.5">
                  {selectedOrder.shipping_address.phone}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-serif uppercase tracking-wider text-[#3B2314]/60 font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9E5A38]" /> Shipping Destination
                </h4>
                <p className="text-xs text-[#3B2314]/90 font-light">
                  {selectedOrder.shipping_address.street}
                </p>
                <p className="text-xs text-[#3B2314]/90 font-light">
                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                  {selectedOrder.shipping_address.postalCode}
                </p>
                <p className="text-xs text-[#3B2314]/90 font-semibold mt-0.5 font-serif uppercase tracking-wider">
                  {selectedOrder.shipping_address.country}
                </p>
              </div>
            </div>

            {/* Items Ordered */}
            <div className="space-y-3">
              <h4 className="text-xs font-serif uppercase tracking-widest text-[#3B2314] font-semibold">
                Ordered Ensembles ({selectedOrder.items?.length || 0})
              </h4>
              <div className="divide-y divide-[#D8CEC4] border border-[#D8CEC4] bg-[#FFFDF9]">
                {(selectedOrder.items || []).map((item, idx) => {
                  const title = item.product?.title || 'Bespoke Couture Ensemble';
                  const price = item.unit_price || 0;
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-serif font-semibold text-[#3B2314] block">
                          {title}
                        </span>
                        <span className="text-[10px] text-[#3B2314]/60 font-mono">
                          Qty: {item.quantity} × ${price.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#3B2314]">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-[#D8CEC4] flex justify-between items-baseline font-serif">
              <span className="text-sm font-semibold uppercase tracking-wider">Total Settlement:</span>
              <span className="text-xl font-bold text-[#9E5A38]">
                ${Number(selectedOrder.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
