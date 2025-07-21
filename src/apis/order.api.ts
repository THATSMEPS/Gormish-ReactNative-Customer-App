// src/apis/order.api.ts

// Import interfaces from types file
import {
  PlaceOrderPayload, PlaceOrderResponse,
  FetchOrderByIdResponse,
  ReviewPayload, SubmitReviewResponse,
  FetchedReview, FetchCustomerReviewsResponse,
  UpdateReviewPayload,
  UpdateReviewResponse
} from '../types/order.types';

// Define your local backend URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// In-memory cache for customer reviews (existing cache)
const customerReviewsCache = new Map<string, FetchedReview[]>();

// --- In-memory Cache for single order details ---
// Cache entry structure: data aur timestamp ko ek object mein store karega
interface OrderCacheEntry {
  data: FetchOrderByIdResponse;
  timestamp: number;
}

// Order details ke liye in-memory cache object.
// Jab browser tab band hoga ya page refresh hoga, toh yeh cache reset ho jayega.
const orderByIdCache = new Map<string, OrderCacheEntry>(); // Using Map for better performance with string keys

// Cache mein data kitni der tak fresh mana jayega (5 minutes)
const ORDER_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Function to place an order on the backend API.
 * @param payload Order details in PlaceOrderPayload format.
 * @returns API response in PlaceOrderResponse format.
 */
// export const placeOrder = async (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
//   try {
//     console.log("Placing order with payload:", payload);

//     const authToken = localStorage.getItem('authToken');
//     if (!authToken) {
//         console.error("placeOrder: Auth token not found in localStorage. Cannot place order.");
//         return { success: false, message: 'Authentication required. Please login.' };
//     }

//     const response = await fetch(`${API_BASE_URL}/orders`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${authToken}`
//       },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || `HTTP error! Status: ${response.status}`);
//     }

//     return { success: true, message: 'Order placed successfully!', orderId: data.data?.orderId };
//   } catch (error: any) {
//     console.error('Error placing order:', error);
//     return { success: false, message: error.message || 'An unknown error occurred during order placement.' };
//   }
// };
export const placeOrder = async (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
  try {
    console.log("Placing order with payload:", payload);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error("placeOrder: Auth token not found in localStorage. Cannot place order.");
      return { success: false, message: 'Authentication required. Please login.' };
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // ✅ MODIFIED LOGIC: Check data.success directly for business logic failures (like busy partners)
    // This is crucial because backend sends 200 OK even if order isn't placed due to business rules.
    if (data.success === false) {
      // Agar backend ne success: false bheja hai, toh uske message ko forward kar dein.
      return { success: false, message: data.message, errorCode: data.errorCode };
    }

    // Original check for true HTTP errors (e.g., 4xx or 5xx where response.ok is false)
    if (!response.ok) {
      // Agar HTTP status 2xx nahi hai, toh error throw karein.
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    // Agar sab theek hai, toh order placed successfully return karein.
    return { success: true, message: 'Order placed successfully!', orderId: data.data?.orderId };
  } catch (error: any) {
    console.error('Error placing order:', error);
    // Network errors ya upar se throw kiye gaye errors ko handle karein.
    return { success: false, message: error.message || 'An unknown error occurred during order placement.' };
  }
};

/**
 * Function to fetch single order details by orderId with in-memory caching.
 * @param orderId The ID of the order to fetch details for.
 * @param forceRefresh Optional parameter to bypass cache and force a network fetch.
 * @returns API response in FetchOrderByIdResponse format.
 */
export const fetchOrderById = async (orderId: string, forceRefresh: boolean = false): Promise<FetchOrderByIdResponse> => {
  const cachedEntry = orderByIdCache.get(orderId); // Get current cached entry

  // If NOT force refreshing, and cache is valid, return cached data
  if (!forceRefresh && cachedEntry) {
    const now = Date.now();
    if (now - cachedEntry.timestamp < ORDER_CACHE_DURATION_MS) {
      console.log(`Cache HIT for order ${orderId}. Returning cached object.`);
      return cachedEntry.data; // Return the exact same cached object reference
    } else {
      console.log(`Cache EXPIRED for order ${orderId}, fetching new data.`);
      orderByIdCache.delete(orderId);
    }
  } else if (forceRefresh) {
    console.log(`Force refresh enabled for order ${orderId}, bypassing cache read.`);
  }

  // Always fetch from network if forceRefresh is true or cache is invalid/expired
  console.log(`Fetching from network for order ${orderId}.`);
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error("fetchOrderById: Auth token not found in localStorage. Cannot fetch order.");
      return { success: false, message: 'Authentication required. Please login.', data: undefined };
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });

    const newData: FetchOrderByIdResponse = await response.json(); // Fetched data

    if (!response.ok) {
      throw new Error(newData.message || `HTTP error! Status: ${response.status}`);
    }

    // ✅ CRITICAL FIX: Compare new data's status with cached data's status
    // If status is the same, and we had a valid cached entry, return the old cached object.
    if (newData.success && newData.data) { // Ensure new data is valid
        if (cachedEntry && cachedEntry.data.data && newData.data.status === cachedEntry.data.data.status) {
            // Status is the same as the cached one.
            // Update timestamp for the cached entry, but return the OLD cached object.
            // This prevents re-renders in React when the status hasn't changed.
            console.log(`Order ${orderId} status is same as cached. Returning OLD cached object for reference stability.`);
            orderByIdCache.set(orderId, {
                data: cachedEntry.data, // Keep the old data object reference
                timestamp: Date.now(), // Update its timestamp
            });
            return cachedEntry.data; // Return the EXACT SAME OBJECT INSTANCE
        } else {
            // Status is different OR no valid cache existed.
            // Cache the NEW data and return it.
            console.log(`Order ${orderId} status changed or no valid cache. Caching and returning NEW object.`);
            orderByIdCache.set(orderId, {
                data: newData, // Store the new data object
                timestamp: Date.now(),
            });
            return newData; // Return the new data object
        }
    }
    // If newData.success is false or newData.data is null, just return it without caching.
    return newData;

  } catch (error: any) {
    console.error(`Error fetching order ${orderId}:`, error);
    return { success: false, message: error.message || 'An unknown error occurred while fetching order.', data: undefined };
  }
};

/**
 * Function to submit an order review to the backend API.
 * @param payload Review details in ReviewPayload format.
 * @returns API response in SubmitReviewResponse format.
 */
export const createOrderReview = async (payload: ReviewPayload): Promise<SubmitReviewResponse> => {
  try {
    console.log("Submitting review with payload:", payload);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error("createOrderReview: Auth token not found in localStorage. Cannot submit review.");
        return { success: false, message: 'Authentication required. Please login.' };
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    customerReviewsCache.delete(payload.customerId);
    console.log(`Cache invalidated for customer: ${payload.customerId} after review submission.`);

    return { success: true, message: data.message || 'Review submitted successfully!', reviewId: data.data?.id };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { success: false, message: error.message || 'An unknown error occurred during review submission.' };
  }
};

/**
 * Function to update an existing order review to the backend API.
 * @param customerId The ID of the customer whose review is being updated (used in URL).
 * @param payload Review details to update, including orderId, reviewText, and stars.
 * @returns API response in UpdateReviewResponse format.
 */
export const updateOrderReview = async (customerId: string, payload: UpdateReviewPayload): Promise<UpdateReviewResponse> => {
  try {
    console.log(`Updating review for customer ${customerId} with payload:`, payload);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error("updateOrderReview: Auth token not found in localStorage. Cannot update review.");
        return { success: false, message: 'Authentication required. Please login.' };
    }

    const response = await fetch(`${API_BASE_URL}/reviews/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    customerReviewsCache.delete(customerId);
    console.log(`Cache invalidated for customer: ${customerId} after review update.`);

    return { success: true, message: data.message || 'Review updated successfully!', data: data.data };
  } catch (error: any) {
    console.error(`Error updating review for customer ${customerId}:`, error);
    return { success: false, message: error.message || 'An unknown error occurred during review update.' };
  }
};

/**
 * Function to fetch customer reviews by customerId with caching.
 * @param customerId The ID of the customer to fetch reviews for.
 * @returns API response in FetchCustomerReviewsResponse format.
 */
export const fetchCustomerReviews = async (customerId: string): Promise<FetchCustomerReviewsResponse> => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error("fetchCustomerReviews: Auth token not found in localStorage. Cannot fetch reviews.");
        return { success: false, message: 'Authentication required. Please login.', data: undefined };
    }

    if (customerReviewsCache.has(customerId)) {
      const cachedReviews = customerReviewsCache.get(customerId);
      if (cachedReviews !== undefined) {
        console.log(`Fetching reviews for customer ${customerId} from cache. 🚀`);
        return { success: true, message: 'Fetched from cache', data: cachedReviews };
      }
    }

    console.log(`Fetching reviews for customer: ${customerId} from API. 🌐`);
    const response = await fetch(`${API_BASE_URL}/reviews/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    const reviewsData = data.data as FetchedReview[];

    customerReviewsCache.set(customerId, reviewsData);
    console.log(`Reviews for customer ${customerId} cached successfully. ✅`);

    return { success: true, message: data.message, data: reviewsData };
  } catch (error: any) {
    console.error(`Error fetching reviews for customer ${customerId}:`, error);
    return { success: false, message: error.message || 'An unknown error occurred while fetching reviews.', data: undefined };
  }
};
