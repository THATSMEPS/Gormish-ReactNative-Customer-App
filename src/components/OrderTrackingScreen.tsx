// components/OrderTrackingScreen.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Phone, Receipt } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOrderById } from '../apis/order.api';
import { CustomerOrder, FetchedOrderItemDetails } from '../types/order.types';
import { OrderStatusDisplay } from './OrderStatusDisplay'; // Make sure this import is correct

interface Props {}

const foodFacts = [
  "Why did the cookie go to the doctor? Because it was feeling crumbly! ✨",
  "What do you call a fake noodle? An impasta! 🍝",
  "Why don't eggs tell jokes? They'd crack up! 🥚",
  "What did the grape say when it got stepped on? Nothing, it just let out a little wine! 🍷",
  "Why did the tomato turn red? Because it saw the salad dressing! 🥗",
  "What kind of room doesn't have doors? A mushroom! 🍄",
  "Why did the pizza go to therapy? It had too many toppings to deal with! 🍕",
  "What do you call a cheese that isn't yours? Nacho cheese! 🧀",
  "Why did the hamburger go to the gym? To get better buns! 🍔",
  "What did the sushi say to the bee? Wasabi! 🍱"
];

export const OrderTrackingScreen = ({}: Props) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [currentFact, setCurrentFact] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // This function now only handles the initial fetch of all order details.
  // The status polling is moved to OrderStatusDisplay.
  const fetchInitialOrderDetails = async () => {
    if (!orderId) {
      setFetchError("No order ID provided in URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // No forceRefresh here, allow cache for initial load if available
      const result = await fetchOrderById(orderId, false); 
      
      if (result.success && result.data) {
        setOrder(result.data); 
        console.log(`OrderTrackingScreen: Initial load for order ${orderId} with status: ${result.data.status}.`);
      } else {
        setFetchError(result.message || "Failed to fetch order details.");
      }
    } catch (err) {
      console.error("OrderTrackingScreen: Error fetching initial order details:", err);
      setFetchError("Could not load order details. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  // EFFECT 1: Initial fetch for full order details (runs only once on mount)
  useEffect(() => {
    fetchInitialOrderDetails(); 

    // Setup food facts interval (this is independent of order status)
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % foodFacts.length);
    }, 3000);

    // Cleanup function: Clear fact interval when component unmounts
    return () => {
      clearInterval(factInterval);
      console.log(`OrderTrackingScreen: Fact interval cleared.`);
    };
  }, [orderId]); // Depend on orderId to refetch if URL changes

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] p-4 space-y-4">
        <div className="h-12 w-12 shimmer rounded-full" />
        <div className="h-12 w-full shimmer rounded-[25px]" />
        <div className="mt-8 space-y-4">
          <div className="h-8 w-32 mx-auto shimmer rounded-[10px]" />
          <div className="h-12 w-48 mx-auto shimmer rounded-[10px]" />
          <div className="h-32 w-full shimmer rounded-[25px] mt-8" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] p-4 flex flex-col items-center justify-center text-center">
        <p className="text-red-600 text-lg mb-4">{fetchError}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#6552FF] text-white py-2 px-4 rounded-full"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] p-4 flex flex-col items-center justify-center text-center">
        <p className="text-gray-600 text-lg mb-4">No order details available.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#6552FF] text-white py-2 px-4 rounded-full"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const customerData = localStorage.getItem('customerData');
  let customerAddressToDisplay = 'Loading address...';

  if (customerData) {
    try {
      const customer = JSON.parse(customerData);
      if (customer && customer.address) {
        let mainAddressPart = '';
        if (typeof customer.address === 'string') {
          mainAddressPart = customer.address;
        } else if (typeof customer.address === 'object' && customer.address !== null && 'typedAddress' in customer.address) {
          mainAddressPart = (customer.address as { typedAddress?: string }).typedAddress || '';
        }

        if (customer.area && customer.area.areaName && customer.area.cityName && customer.area.stateName) {
          customerAddressToDisplay = `${mainAddressPart}, ${customer.area.areaName}, ${customer.area.cityName}, ${customer.area.stateName}, India`;
        } else {
          customerAddressToDisplay = mainAddressPart || 'Customer address details incomplete.';
        }
      } else {
        customerAddressToDisplay = 'Customer address not found in data.';
      }
    } catch (e) {
      console.error("Failed to parse customer data from localStorage:", e);
      customerAddressToDisplay = 'Error loading address.';
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F5]">
      <div className="p-4 space-y-8">
        {/* Header */}
        <div className="flex items-center">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-2 flex-1 bg-white rounded-full py-2 px-3 flex items-center gap-2 min-w-0"
          >
            <MapPin size={14} className="text-black/70 flex-shrink-0" />
            <span className="text-xs font-light text-black/70 truncate">
              {customerAddressToDisplay}
            </span>
          </motion.div>
        </div>

        {/* Delivery Time (Still hardcoded) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center"
        >
          <div className="bg-[#6552FF]/15 rounded-[10px] px-4 py-2 flex items-center gap-2">
            <Clock size={16} className="text-[#6552FF]" />
            <span className="text-[#6552FF] font-medium">20-30 min</span>
          </div>
        </motion.div>

        {/* Order Status - This is now entirely handled by OrderStatusDisplay */}
        <div className="text-center space-y-2 mb-8">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold"
          >
            Order is
          </motion.h2>
          {/* ✅ FIX: Pass orderId to OrderStatusDisplay for its internal polling */}
          <OrderStatusDisplay orderId={orderId!} /> 
        </div>

        {/* Order Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[25px] p-6"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
              <Receipt size={18} className="text-[#6552FF]" />
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium">Order ID</span>
                <span className="text-sm text-[#6552FF] font-medium">#{order.id.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-4">
              {order.items.map((orderItem: FetchedOrderItemDetails, index: number) => (
                <motion.div
                  key={orderItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#6552FF]/10 rounded-full flex items-center justify-center">
                      <span className="text-xs text-[#6552FF] font-medium">{orderItem.quantity}×</span>
                    </div>
                    <span className="text-sm font-medium">{orderItem.menuItem.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">₹{parseFloat(orderItem.totalPrice).toFixed(2)}</span>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-gray-200 space-y-2">
              <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total Amount</span>
                <span>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated Food Facts */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFact}
              initial={{ opacity: 0, y: 20 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center relative"
            >
              <div className="bg-white rounded-[25px] p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
                <p className="text-base font-medium text-gray-800 relative z-10 animate-shine-text">
                  {foodFacts[currentFact]}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customer Care / Call details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[25px] p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="font-medium">Call Restaurant</h3>
            <p className="text-sm text-gray-500">Restaurant Manager</p>
          </div>
          <motion.a
            href={`tel:+91${order.restaurant.mobile}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-[#6552FF] rounded-full flex items-center justify-center"
          >
            <Phone size={20} className="text-white" />
          </motion.a>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[25px] p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="font-medium">Customer Care</h3>
            <p className="text-sm text-gray-500">Feel free to raise issues</p>
          </div>
          <motion.a
            href="tel:+919408393005"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-[#6552FF] rounded-full flex items-center justify-center"
          >
            <Phone size={20} className="text-white" />
          </motion.a>
        </motion.div>

        {/* Gormish Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center py-4"
        >
          <img
            src="https://about.gormish.in/images/gormish-logo.svg"
            alt="Gormish"
            className="h-12"
          />
        </motion.div>
      </div>
    </div>
  );
};
