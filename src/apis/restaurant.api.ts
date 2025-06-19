// apis/restaurant.api.ts

import { Restaurant, MenuItem } from '../types/restaurant.types'; // Types import kiye

// API Response ka common interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// API ka base URL, .env se ya default localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let authToken: string = "";
const localStorageAuthToken = localStorage.getItem('authToken')
if(localStorageAuthToken) {
  authToken = localStorageAuthToken
}

// --- Caching System Setup ---

// Cache mein store hone wale har entry ka structure
interface CacheEntry<T> {
  data: T;
  timestamp: number; // Jab data cache kiya gaya tha (milliseconds mein)
}

// In-memory cache object jahan saara API data store hoga
const apiCache: { [key: string]: CacheEntry<any> } = {};

// Cache mein data kitni der tak fresh mana jayega (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Ek generic function jo kisi bhi API fetcher function ko cache functionality provide karti hai.
 * Yeh function check karegi ki data cache mein hai aur fresh hai ya nahi.
 * Agar fresh hai, toh cache se return karegi, warna network call karegi aur cache karegi.
 * @param cacheKey Cache mein data store karne ke liye unique key.
 * @param fetcher Woh async function jo actual API call karega aur data return karega.
 * @returns Cached data ya network se fetched data.
 */
async function createCachedApiFetcher<T>(
  cacheKey: string,
  fetcher: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  // Pehle cache mein data check karein
  const cachedData = apiCache[cacheKey] as CacheEntry<ApiResponse<T>>;

  if (cachedData) {
    const now = Date.now();
    // Agar data fresh hai (CACHE_DURATION ke andar)
    if (now - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Cache HIT for ${cacheKey}`);
      return cachedData.data; // Cached data return karein
    } else {
      console.log(`Cache EXPIRED for ${cacheKey}`);
      delete apiCache[cacheKey]; // Expired entry hata dein
    }
  }

  console.log(`Cache MISS for ${cacheKey}. Fetching from network.`);
  // Agar cache mein nahi hai ya expired hai, toh network call karein
  try {
    const responseData = await fetcher(); // Actual API fetcher function ko call karein

    // Agar API call successful hai, toh data ko cache karein
    if (responseData.success) {
      apiCache[cacheKey] = {
        data: responseData,
        timestamp: Date.now(),
      };
      console.log(`Data cached for ${cacheKey}`);
    }
    return responseData; // Network se aaya hua data return karein
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error);
    throw error; // Error ko re-throw karein
  }
}

// --- API Fetch Functions (ab yeh createCachedApiFetcher ka use karenge) ---

/**
 * Saare restaurants fetch karta hai. Caching applied.
 */
export const fetchRestaurants = async (): Promise<ApiResponse<Restaurant[]>> => {
  return createCachedApiFetcher<Restaurant[]>(
    'allRestaurants', // Cache key
    async () => {
      const response = await fetch(`${API_BASE_URL}/restaurants`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    }
  );
};

/**
 * Kisi specific restaurant ko ID ke through fetch karta hai. Caching applied.
 * @param id Restaurant ki unique ID.
 */
export const fetchRestaurantById = async (id: string): Promise<ApiResponse<Restaurant>> => {
  return createCachedApiFetcher<Restaurant>(
    `restaurant_${id}`, // Cache key mein ID shamil karein
    async () => {
      const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    }
  );
};

/**
 * Kisi specific restaurant ka menu fetch karta hai. Caching applied.
 * @param id Restaurant ki unique ID.
 */
// export const fetchRestaurantMenu = async (id: string): Promise<ApiResponse<MenuItem[]>> => {
//   return createCachedApiFetcher<MenuItem[]>(
//     `restaurantMenu_${id}`, // Cache key mein ID shamil karein
//     async () => {
//       const response = await fetch(`${API_BASE_URL}/menu/restaurant/${id}`);
//       if (!response.ok) {
//         throw new Error(`Network response was not ok: ${response.status}`);
//       }
//       return response.json();
//     }
//   );
// };
export const fetchRestaurantMenu = async (id: string): Promise<ApiResponse<MenuItem[]>> => {
  console.log(`Fetching FRESH restaurant menu for ID: ${id} (no caching)`);
  try {
    const response = await fetch(`${API_BASE_URL}/menu/restaurant/${id}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching restaurant menu for ${id}:`, error);
    throw error;
  }
};