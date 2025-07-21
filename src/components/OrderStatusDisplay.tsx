// src/components/OrderStatusDisplay.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOrderById } from '../apis/order.api'; // Import the API function

interface OrderStatusDisplayProps {
  orderId: string; // Order ID as a prop to fetch status
}

const orderStatusMap: Record<string, string> = {
  'pending': 'pending',
  'preparing': 'preparing',
  'on_the_way': 'on the way',
  'on the way': 'on the way',
  'at_your_doorstep': 'at your doorstep',
  'at your doorstep': 'at your doorstep',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
};

// React.memo ensures this component only re-renders if its props change.
// Now, it also manages its own internal status state, so only the status text updates.
export const OrderStatusDisplay = React.memo(({ orderId }: OrderStatusDisplayProps) => {
  const [latestStatus, setLatestStatus] = useState<string>('...'); // Internal state for status

  // Effect to fetch and poll order status
  useEffect(() => {
    // Initial fetch of the status
    const fetchCurrentStatus = async () => {
      try {
        // Always force refresh to get the latest status from the backend
        const result = await fetchOrderById(orderId, true); 
        if (result.success && result.data) {
          // Update internal state ONLY if the status string has actually changed
          if (latestStatus !== result.data.status) {
            console.log(`OrderStatusDisplay: Status for ${orderId} changed from ${latestStatus} to ${result.data.status}. Updating...`);
            setLatestStatus(result.data.status);
          } else {
            console.log(`OrderStatusDisplay: Status for ${orderId} is still ${result.data.status}. No internal update.`);
          }
        } else {
          console.error(`OrderStatusDisplay: Failed to fetch status for ${orderId}: ${result.message}`);
          setLatestStatus('Error');
        }
      } catch (error) {
        console.error(`OrderStatusDisplay: Error polling status for ${orderId}:`, error);
        setLatestStatus('Error');
      }
    };

    fetchCurrentStatus(); // Initial fetch

    // Setup polling interval for status updates
    const pollingInterval = setInterval(() => {
      console.log(`OrderStatusDisplay: Polling status for ${orderId}...`);
      fetchCurrentStatus();
    }, 5000); // Poll every 5 seconds

    // Cleanup function: Clear interval when component unmounts or orderId changes
    return () => {
      clearInterval(pollingInterval);
      console.log(`OrderStatusDisplay: Polling interval cleared for ${orderId}.`);
    };
  }, [orderId, latestStatus]); // latestStatus in dependencies for proper comparison, but fetchOrderById's reference stability prevents infinite loop.

  const displayStatus = orderStatusMap[latestStatus.toLowerCase()] || latestStatus;

  return (
    <AnimatePresence mode="wait">
      {/* Key is crucial here: it tells Framer Motion to animate a change when the status string itself changes */}
      <motion.div
        key={displayStatus} // Use the processed status string as the key
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="text-2xl font-bold text-[#6552FF] capitalize"
      >
        {displayStatus}
      </motion.div>
    </AnimatePresence>
  );
});

// For better debugging, give the memoized component a displayName
OrderStatusDisplay.displayName = 'OrderStatusDisplay';