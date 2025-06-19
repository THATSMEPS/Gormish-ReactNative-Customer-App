// src/components/PhonePopup.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface for the incoming customer data and the update function
interface PhonePopupProps {
  isOpen: boolean;
  // onClose will NOW ONLY be called on successful update.
  // It no longer signifies a user-initiated close without action.
  onClose: (updatedCustomerData?: any) => void; 
  currentPhone: string | null;
  customerId: string;
  onUpdatePhone: (customerId: string, phone: string) => Promise<{ success: boolean; data?: any; message?: string }>;
}

export const PhonePopup: React.FC<PhonePopupProps> = ({
  isOpen,
  onClose,
  currentPhone,
  customerId,
  onUpdatePhone,
}) => {
  const [phone, setPhone] = useState<string>(currentPhone || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    // Simple 10-digit phone number validation
    if (!phone.match(/^\d{10}$/)) { 
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onUpdatePhone(customerId, phone);
      if (result.success) {
        // Only call onClose if the update was successful
        onClose(result.data); // Pass updated data back to App.tsx
      } else {
        setError(result.message || 'Failed to update phone number. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while updating the phone number. Please check your network.');
      console.error('Phone update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          // Prevent closing by clicking outside
          onClick={(e) => e.stopPropagation()} 
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-[25px] p-6 shadow-xl max-w-sm w-full relative"
            // Prevent closing by clicking inside the modal content
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="text-xl font-bold mb-4 text-center">Update Phone Number</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Please provide your 10-digit phone number to continue. This is required.
            </p>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                placeholder="e.g., 9876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6552FF]/50"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

            <motion.button
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full bg-[#6552FF] text-white py-3 rounded-[15px] font-semibold text-lg transition-colors duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#5241D3]'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Number'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};