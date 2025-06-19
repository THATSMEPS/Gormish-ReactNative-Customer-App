// components/OrderCardWithReview.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import { CustomerOrder, FetchedOrderItemDetails, FetchedReview } from '../types/order.types'; // ✅ UpdateReviewPayload import kiya
import { createOrderReview, updateOrderReview } from '../apis/order.api'; // ✅ updateOrderReview import kiya

interface OrderCardWithReviewProps {
  order: CustomerOrder;
  existingReview: FetchedReview | undefined;
  orderStatusPillMap: Record<string, string>; 
  onReviewSubmitted: () => void; 
  onOrderClick: (order: CustomerOrder) => void; 
}

export const OrderCardWithReview = ({ 
  order, 
  existingReview, 
  orderStatusPillMap, 
  onReviewSubmitted,
  onOrderClick 
}: OrderCardWithReviewProps) => {

  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmissionMessage, setReviewSubmissionMessage] = useState<string | null>(null);
  const [stars, setStars] = useState<number | null>(existingReview?.stars || null);
  // Hover state for visual feedback of half-stars
  const [hoverStars, setHoverStars] = useState<number | null>(null);

  
  // Customer ID ko yahan bhi define karna hoga ya prop ke through pass karna hoga
  let CUSTOMER_ID: string = "";
  const localStorageCustomerId = localStorage.getItem('customerId')
  if(localStorageCustomerId) {
    CUSTOMER_ID = localStorageCustomerId
  } 

  useEffect(() => {
    setReviewText(existingReview?.reviewText || '');
    setStars(existingReview?.stars || null);
    setReviewSubmissionMessage(null);
    setIsSubmittingReview(false);
    setHoverStars(null); 
  }, [existingReview]);

  const handleCardReviewSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!reviewText.trim()) {
      setReviewSubmissionMessage("Review text cannot be empty.");
      return;
    }
    if (stars === null) {
      setReviewSubmissionMessage("Please select a star rating.");
      return;
    }
    if (isSubmittingReview) return;

    setIsSubmittingReview(true);
    setReviewSubmissionMessage(null);

    try {
      // Common payload structure for both create and update
      const commonPayload = {
        orderId: order.id,
        customerId: CUSTOMER_ID,
        reviewText: reviewText.trim(),
        stars: stars as number // Type assertion as stars will not be null here
      };
      
      let result;
      // ✅ Check if existingReview is available to decide between create or update
      if (existingReview) { 
        // If a review already exists, call the update API
        // No need to pass reviewId in payload, it's identified by customerId and orderId
        result = await updateOrderReview(CUSTOMER_ID, commonPayload); // customerId is in URL, commonPayload for body
      } else {
        // If no existing review, call the create API
        result = await createOrderReview(commonPayload);
      }

      if (result.success) {
        setReviewSubmissionMessage("Review submitted successfully! 🎉");
        onReviewSubmitted(); 
      } else {
        setReviewSubmissionMessage(`Failed to submit review: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setReviewSubmissionMessage("An unexpected error occurred while submitting review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const statusPillClass = orderStatusPillMap[order.status.toLowerCase()] || orderStatusPillMap.default;

  const renderStar = (starIndex: number) => {
    const currentRating = hoverStars !== null ? hoverStars : (stars !== null ? stars : 0);
    const starValue = starIndex + 1;

    let fillPercentage = 0;
    if (currentRating >= starValue) {
      fillPercentage = 100;
    } else if (currentRating >= starValue - 0.5) {
      fillPercentage = 50;
    }
    
    return (
      <div 
        key={starIndex} 
        className="relative flex items-center overflow-hidden" 
        style={{ width: '24px', height: '24px', cursor: isSubmittingReview ? 'not-allowed' : 'pointer' }}
        onMouseMove={(e) => {
          if (isSubmittingReview) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const width = rect.width;
          let newRating = 0;

          if (x < width / 2) { 
            newRating = starValue - 0.5;
          } else { 
            newRating = starValue;
          }
          setHoverStars(newRating);
        }}
        onMouseLeave={() => {
          if (!isSubmittingReview) {
            setHoverStars(null);
          }
        }}
        onClick={(e) => {
          e.stopPropagation(); 
          if (!isSubmittingReview) {
            setStars(hoverStars); 
            setReviewSubmissionMessage(null);
          }
        }}
      >
        <FaStar size={24} className="absolute top-0 left-0 text-gray-300" />
        
        <FaStar 
          size={24} 
          className="absolute top-0 left-0 text-yellow-400" 
          style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
        />
      </div>
    );
  };

  const hasReviewTextChanged = reviewText.trim() !== (existingReview?.reviewText || '');
  const hasStarsChanged = stars !== (existingReview?.stars ?? null);

  const hasChanges = hasReviewTextChanged || hasStarsChanged;

  const isButtonDisabled = isSubmittingReview || !reviewText.trim() || stars === null || (existingReview && !hasChanges);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-[25px] p-4 space-y-4 shadow-md"
    >
      {/* Card Header - Clickable for Popup */}
      <div className="space-y-4 cursor-pointer" onClick={() => onOrderClick(order)}>
        <div className="flex items-center justify-between"> 
          <div className="flex items-center gap-2">
            <Package className="text-[#6552FF]" size={20} />
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase ${statusPillClass}`}>
              {order.status}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(order.placedAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-base">{order.restaurant.name}</p> 
          {order.items.map((orderItem: FetchedOrderItemDetails) => (
            <div key={orderItem.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#6552FF]/10 rounded-full flex items-center justify-center">
                  <span className="text-xs text-[#6552FF]">{orderItem.quantity}×</span>
                </div>
                <span className="font-medium">{orderItem.menuItem.name}</span>
              </div>
              <span className="text-gray-500">₹{parseFloat(orderItem.totalPrice).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-medium">Total Amount</span>
          <div className="flex items-center gap-1">
            <span className="text-lg text-[#6552FF] font-bold">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* NEW: Order Review Section */}
      <div className={`border-t border-gray-200 py-4 ${isSubmittingReview ? 'pointer-events-none' : ''}`}>
        <h3 className="font-semibold mb-3">Rate Your Order</h3>
        <div className="flex flex-col gap-3">
          <textarea
            value={reviewText}
            onChange={(e) => {
              if (!isSubmittingReview) {
                setReviewText(e.target.value);
                setReviewSubmissionMessage(null);
              }
            }}
            placeholder="Share your experience..."
            rows={3}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6552FF] resize-none text-sm"
            disabled={isSubmittingReview} 
          ></textarea>
          <div className="flex items-center justify-between gap-2 w-full"> 
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((starIndex) => renderStar(starIndex))} 
            </div>
            <button
              onClick={handleCardReviewSubmit}
              className={`shrink-0 px-6 h-9 rounded-xl font-semibold text-white transition-colors min-w-[120px] text-center
                flex items-center justify-center
                ${isButtonDisabled 
                  ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6552FF] hover:bg-[#5242CC]'
                }
              `}
              disabled={isButtonDisabled}
            >
              {existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </div>
        {reviewSubmissionMessage && (
          <p className={`mt-2 text-sm text-center ${reviewSubmissionMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
            {reviewSubmissionMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
};