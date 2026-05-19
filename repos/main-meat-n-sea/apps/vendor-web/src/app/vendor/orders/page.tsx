'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // In a real app, we'd hook up WebSocket/Socket.io here for live updates.
    // For now, we poll every 10 seconds.
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/vendors/me/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/api/vendors/me/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Live Orders</h2>

      {loading && orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No active orders</h3>
          <p className="text-gray-500">Waiting for incoming requests...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-500">Order ID: {order._id.substring(order._id.length - 8)}</span>
                  <span className={`ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${order.status === 'placed' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pickup_assigned' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500">Total</span>
                  {/* Convert subtotal from Paise to Rupees */}
                  <p className="text-lg font-bold text-gray-900">₹{(order.subtotal / 100).toFixed(2)}</p>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={16} /> Items
                  </h4>
                  <ul className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>{item.qty}x {item.name}</span>
                        <span>₹{item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin size={16} /> Delivery To
                    </h4>
                    <p className="text-sm text-gray-600">{order.deliveryAddress?.address || 'Pickup from store'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock size={16} /> Timeline
                    </h4>
                    <p className="text-sm text-gray-600">Placed: {new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
                {order.status === 'placed' && (
                  <button
                    onClick={() => updateStatus(order._id, 'accepted')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Accept Order
                  </button>
                )}
                {order.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(order._id, 'preparing')}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateStatus(order._id, 'pickup_assigned')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-700"
                  >
                    <CheckCircle size={18} /> Ready for Pickup
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
