// components/OrderHistory.tsx

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { ArrowLeft, X } from 'lucide-react'; 
import { fetchCustomerOrders } from '../apis/customer.api';
import { fetchCustomerReviews } from '../apis/order.api';
import { CustomerOrder, FetchedOrderItemDetails, FetchedReview } from '../types/order.types';
import { OrderCardWithReview } from './OrderCardWithReview'; 

interface Props {
  onBack: () => void;
}

const orderStatusPillMap: Record<string, string> = {
  'rejected': 'bg-red-500 text-white',
  'cancelled': 'bg-gray-500 text-white',
  'delivered': 'bg-green-500 text-white',
  'preparing': 'bg-gray-300 text-gray-800',
  'ready': 'bg-blue-500 text-white',
  'dispatch': 'bg-purple-500 text-white',
  'default': 'bg-gray-300 text-gray-800'
};

// --- Order Details Popup Component (No Review Logic here now) ---
interface OrderDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder | null;
}

const OrderDetailsPopup = ({ isOpen, onClose, order }: OrderDetailsPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-[25px] p-6 max-w-lg w-full shadow-lg overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center">Order Details</h2>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-800">
                #{order.id.substring(0, 8).toUpperCase()}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold uppercase ${orderStatusPillMap[order.status.toLowerCase()] || orderStatusPillMap.default}`}>
                {order.status}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{order.restaurant.name}</h3>
              <p className="text-sm text-gray-600">
                {order.restaurant.address.street}, {order.restaurant.address.city}
              </p>
            </div>

            <div className="border-t border-gray-200 py-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-3">
                {order.items.map((orderItem: FetchedOrderItemDetails) => (
                  <div key={orderItem.id} className="flex flex-col">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{orderItem.quantity}×</span>
                        <span className="font-medium">{orderItem.menuItem.name}</span>
                      </div>
                      <span>₹{parseFloat(orderItem.totalPrice).toFixed(2)}</span>
                    </div>

                    {orderItem.addons && Array.isArray(orderItem.addons) && orderItem.addons.length > 0 && (
                      <div className="ml-6 mt-1 text-xs text-gray-600">
                        {orderItem.addons.map((addon: any, addonIndex: number) => (
                          <p key={`${orderItem.id}-addon-${addonIndex}`}>
                            + {addon.name} (₹{parseFloat(addon.extraPrice).toFixed(2)})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total Amount</span>
                <span>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              Order Placed At: {new Date(order.placedAt).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
// --- End Order Details Popup Component ---


export const OrderHistory = ({ onBack }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customerReviews, setCustomerReviews] = useState<FetchedReview[]>([]);
  
  const [showOrderDetailsPopup, setShowOrderDetailsPopup] = useState(false);
  const [selectedOrderForPopup, setSelectedOrderForPopup] = useState<CustomerOrder | null>(null);

  
  let CUSTOMER_ID: string = "";
  const localStorageCustomerId = localStorage.getItem('customerId')
  if(localStorageCustomerId) {
    CUSTOMER_ID = localStorageCustomerId
  }

  const getCustomerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordersResponse = await fetchCustomerOrders(CUSTOMER_ID);
      let fetchedOrders: CustomerOrder[] = [];
      if (ordersResponse.success && ordersResponse.data) {
        fetchedOrders = ordersResponse.data.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        setOrders(fetchedOrders);
      } else {
        setError(ordersResponse.message || 'Failed to fetch customer orders.');
      }

      const reviewsResponse = await fetchCustomerReviews(CUSTOMER_ID);
      if (reviewsResponse.success && reviewsResponse.data) {
        setCustomerReviews(reviewsResponse.data);
      } else {
        console.error(reviewsResponse.message || 'Failed to fetch customer reviews.');
        setCustomerReviews([]);
      }

    } catch (err: any) {
      console.error("Error fetching customer data:", err);
      setError(err.message || 'An unexpected error occurred while fetching data.');
      setOrders([]);
      setCustomerReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCustomerData();
  }, []);

  const handleOrderClick = (order: CustomerOrder) => {
    setSelectedOrderForPopup(order);
    setShowOrderDetailsPopup(true);
  };

  const handleClosePopup = () => {
    setShowOrderDetailsPopup(false);
    setSelectedOrderForPopup(null);
  };

  const handleReviewSubmitted = () => {
    getCustomerData(); 
  };

  return (
    <div className="min-h-screen bg-[#F2F2F5]">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-xl font-semibold">Order History</h1>
        </div>

        <div className="space-y-4 pb-24">
          <AnimatePresence> 
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <motion.div
                  key={`shimmer-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[25px] p-4 space-y-4"
                >
                  <div className="h-6 w-32 shimmer rounded-full" />
                  <div className="h-4 w-full shimmer rounded-full" />
                  <div className="h-4 w-3/4 shimmer rounded-full" />
                  <div className="h-6 w-24 shimmer rounded-full" />
                </motion.div>
              ))
            ) : error ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-red-500 bg-white rounded-[25px] p-4"
                >
                    <p>{error}</p>
                </motion.div>
            ) : orders.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-500 bg-white rounded-[25px] p-4"
                >
                    <p>No orders found.</p>
                </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4" 
              >
                {orders.map((order: CustomerOrder) => {
                  const existingReview = customerReviews.find(review => review.orderId === order.id);

                  return (
                    <OrderCardWithReview
                      key={order.id}
                      order={order}
                      existingReview={existingReview}
                      orderStatusPillMap={orderStatusPillMap} 
                      onReviewSubmitted={handleReviewSubmitted} 
                      onOrderClick={handleOrderClick} 
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <OrderDetailsPopup
        isOpen={showOrderDetailsPopup}
        onClose={handleClosePopup}
        order={selectedOrderForPopup}
      />
    </div>
  );
};