// Order & Payment state management with LocalStorage persistence

const INITIAL_ORDERS = [];

const STORAGE_KEY = 'reloop_orders_fresh_v3';

export const orderService = {
  clearAllOrders: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('reloop_orders_data_clean');
      localStorage.setItem('reloop_last_mutation', Date.now().toString());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated'));
      }
    } catch (e) {
      console.error('Failed to clear orders', e);
    }
  },

  getOrders: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return INITIAL_ORDERS;
  },

  saveOrders: (orders) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      localStorage.setItem('reloop_last_mutation', Date.now().toString());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated'));
      }
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  },

  createOrder: (orderPayload) => {
    const orders = orderService.getOrders();
    const newId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const resourceFee = Number((orderPayload.volume * 0.20).toFixed(2));
    const verificationFee = orderPayload.needQualityCheck !== false ? 150.00 : 0.00;
    const transportFee = 200.00;
    const greenDiscount = -50.00;
    const total = Number((resourceFee + verificationFee + transportFee + greenDiscount).toFixed(2));

    const newOrder = {
      id: newId,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'In Transit',
      supplierName: orderPayload.supplierName || 'Factory A STP Plant',
      waterType: orderPayload.waterType || 'Industrial Recycled',
      volume: orderPayload.volume || 4000,
      destination: orderPayload.destination || 'Green Park Facility Tank #1',
      driver: 'K. Ramesh (+91 98401 22334)',
      tanker: 'EcoFlow Tanker TN-09-AX-4421',
      eta: 'In Transit — 25 mins away',
      qaStatus: orderPayload.needQualityCheck !== false ? 'AquaCert QA-Pending Verification' : 'Self-Declaration (No Lab Check)',
      paymentMethod: orderPayload.paymentMethod || 'UPI (nivi@okaxis)',
      transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      costBreakdown: {
        resourceFee,
        verificationFee,
        transportFee,
        greenDiscount,
        total
      },
      cancellationPolicy: {
        deductionAmount: Number((total * 0.15).toFixed(2)),
        refundAmount: Number((total * 0.85).toFixed(2)),
        tier: 'Standard redBus-Style Policy (15% Deduction fee)'
      },
      refundDetails: null
    };

    const updated = [newOrder, ...orders];
    orderService.saveOrders(updated);
    return newOrder;
  },

  cancelOrder: (orderId, reason = 'Customer requested cancellation') => {
    const orders = orderService.getOrders();
    const target = orders.find(o => o.id === orderId);
    if (!target) return null;

    const deductions = target.cancellationPolicy?.deductionAmount ?? 50.00;
    const refund = Number((target.costBreakdown.total - deductions).toFixed(2));

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'Cancelled',
          refundDetails: {
            status: 'Refund Initiated',
            refundId: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
            totalPaid: o.costBreakdown.total,
            deductions: deductions,
            refundAmount: refund,
            initiatedAt: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reason,
            targetAccount: o.paymentMethod
          }
        };
      }
      return o;
    });

    orderService.saveOrders(updatedOrders);
    return updatedOrders.find(o => o.id === orderId);
  }
};
