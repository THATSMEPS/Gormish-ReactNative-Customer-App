// apis/customer.api.ts

import { FetchCustomerResponse, UpdateCustomerAddressPayload, UpdateCustomerAddressResponse, Customer } from '../types/customer.types';
import { FetchCustomerOrdersResponse } from '../types/order.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// --- Caching System Setup ---

// Cache entry structure (ab generic ho gaya hai)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache objects
const customerApiCache: { [key: string]: CacheEntry<FetchCustomerResponse> } = {};
const customerOrdersApiCache: { [key: string]: CacheEntry<FetchCustomerOrdersResponse> } = {};

// Cache mein data kitni der tak fresh mana jayega (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Ek generic helper function jo caching provide karti hai.
 * Ye FetchCustomerResponse aur FetchCustomerOrdersResponse dono ke liye kaam karegi.
 * @param cacheKey Cache mein data store karne ke liye unique key.
 * @param fetcher Woh async function jo actual API call karega aur data return karega.
 * @param cacheObject Woh specific cache object jismein data store karna hai (e.g., customerApiCache, customerOrdersApiCache).
 * @returns Cached data ya network se fetched data.
 */
async function createCachedApiFetcher<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  cacheObject: { [key: string]: CacheEntry<T> } // Cache object as a parameter
): Promise<T> {
  const cachedData = cacheObject[cacheKey]; // Use the passed cacheObject

  if (cachedData) {
    const now = Date.now();
    if (now - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Cache HIT for ${cacheKey}`);
      return cachedData.data;
    } else {
      console.log(`Cache EXPIRED for ${cacheKey}`);
      delete cacheObject[cacheKey]; // Delete from the passed cacheObject
    }
  }

  console.log(`Cache MISS for ${cacheKey}. Fetching from network.`);
  try {
    const responseData = await fetcher();
    // Assuming API responses always have a 'success' property for successful calls
    if ((responseData as any).success) { 
      cacheObject[cacheKey] = { // Cache to the passed cacheObject
        data: responseData,
        timestamp: Date.now(),
      };
      console.log(`Data cached for ${cacheKey}`);
    }
    return responseData;
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error);
    // Re-throw the error to be caught by the calling function (fetchCustomerById/fetchCustomerOrders)
    throw error; 
  }
}

// --- API Fetch Functions ---

/**
 * Function to fetch customer details by ID. Caching applied.
 * @param customerId The ID of the customer to fetch.
 * @returns API response in FetchCustomerResponse format.
 */
export const fetchCustomerById = async (customerId: string): Promise<FetchCustomerResponse> => {
  return createCachedApiFetcher<FetchCustomerResponse>( // Generic type specify kiya
    `customer-${customerId}`, // Unique cache key
    async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error("fetchCustomerById: Auth token not found in localStorage.");
            return { success: false, message: 'Authentication required. No token found.', data: undefined };
        }

        const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
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

        return { success: true, message: data.message, data: data.data };
      } catch (error: any) {
        console.error(`Error fetching customer ${customerId} from network:`, error);
        return { success: false, message: error.message || 'Failed to fetch customer details from network.', data: undefined };
      }
    },
    customerApiCache // ✅ customerApiCache ko explicitly pass kiya
  );
};

// New function to update customer's phone number
export const updateCustomerPhone = async (customerId: string, phone: string): Promise<ApiResponse<Customer>> => {
  try {

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error("fetchCustomerById: Auth token not found in localStorage.");
      return { success: false, message: 'Authentication required. No token found.', data: undefined };
    }

    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'PUT', // Use PUT method for updates
      headers: {
        'Content-Type': 'application/json',
        // Add any necessary authorization headers here if your API requires them
        'Authorization': `Bearer ${authToken}`, 
      },
      body: JSON.stringify({ phone }), // Send only the phone field in the body
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.message || 'Failed to update phone number.' };
    }

    const data = await response.json();
    // Assuming the API returns the updated customer object directly in 'data'
    return { success: true, data: data.data, message: data.message || 'Phone number updated successfully!' };
  } catch (error: any) {
    console.error("Error in updateCustomerPhone:", error);
    return { success: false, message: error.message || 'Network error occurred while updating phone number.' };
  }
};

/**
 * Function to update customer address.
 * @param customerId The ID of the customer to update.
 * @param payload The update payload containing the new address details.
 * @returns API response in UpdateCustomerAddressResponse format.
 */
export const updateCustomerAddress = async (customerId: string, payload: UpdateCustomerAddressPayload): Promise<UpdateCustomerAddressResponse> => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error("updateCustomerAddress: Auth token not found in localStorage.");
        return { success: false, message: 'Authentication required. No token found.', data: undefined };
    }

    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
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

    if (customerApiCache[`customer-${customerId}`]) {
        console.log(`Invalidating cache for customer-${customerId} after update.`);
        delete customerApiCache[`customer-${customerId}`];
    }
    if (customerOrdersApiCache[`customer-orders-${customerId}`]) { // customerOrdersApiCache ko use kiya hai
      console.log(`Invalidating orders cache for customer-${customerId} after address update.`);
      delete customerOrdersApiCache[`customer-orders-${customerId}`];
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error(`Error updating customer address for ${customerId}:`, error);
    return { success: false, message: error.message || 'An unknown error occurred while updating address.', data: undefined };
  }
};

/**
 * Function to fetch all orders for a particular customer. Caching applied.
 * @param customerId The ID of the customer whose orders to fetch.
 * @returns API response in FetchCustomerOrdersResponse format.
 */
export const fetchCustomerOrders = async (customerId: string): Promise<FetchCustomerOrdersResponse> => {
  // ✅ NEW: createCachedApiFetcher ka use kiya hai, aur customerOrdersApiCache ko pass kiya hai
  return createCachedApiFetcher<FetchCustomerOrdersResponse>(
    `customer-orders-${customerId}`, // Customer ke orders ke liye unique cache key
    async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error("fetchCustomerOrders: Auth token not found in localStorage.");
            return { success: false, message: 'Authentication required. No token found.', data: [] };
        }

        const response = await fetch(`${API_BASE_URL}/orders/customer/${customerId}`, {
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

        return { success: true, message: data.message, data: data.data };
      } catch (error: any) {
        console.error(`Error fetching orders for customer ${customerId} from network:`, error);
        return { success: false, message: error.message || 'Failed to fetch customer orders from network.', data: [] };
      }
    },
    customerOrdersApiCache // ✅ customerOrdersApiCache ko explicitly pass kiya
  );
};