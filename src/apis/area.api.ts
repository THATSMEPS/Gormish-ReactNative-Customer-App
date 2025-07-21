// apis/area.api.ts

import { FetchAreasResponse } from '../types/area.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Function to fetch all available areas from the backend API.
 * @returns API response in FetchAreasResponse format.
 */
export const fetchAreas = async (): Promise<FetchAreasResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Error fetching areas:", error);
    return { success: false, message: error.message || 'An unknown error occurred while fetching areas.', data: [] };
  }
};







// // apis/area.api.ts

// import { FetchAreasResponse } from '../types/area.types'; // Area type bhi import kiya hai

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// // --- Caching System Setup (customer.api.ts se copy kiya gaya) ---

// // Cache mein store hone wale har entry ka structure
// interface CacheEntry {
//   data: FetchAreasResponse; // Directly store the full API response for areas
//   timestamp: number; // Jab data cache kiya gaya tha (milliseconds mein)
// }

// // In-memory cache object jahan saara API data store hoga
// const apiCache: { [key: string]: CacheEntry } = {};

// // Cache mein data kitni der tak fresh mana jayega (5 minutes)
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// /**
//  * Ek generic function jo kisi bhi API fetcher function ko cache functionality provide karti hai.
//  * Yeh function check karegi ki data cache mein hai aur fresh hai ya nahi.
//  * Agar fresh hai, toh cache se return karegi, warna network call karegi aur cache karegi.
//  * Ab yeh generic 'T' ka use nahi karta hai, seedha FetchAreasResponse type ke liye hai.
//  * @param cacheKey Cache mein data store karne ke liye unique key.
//  * @param fetcher Woh async function jo actual API call karega aur data return karega.
//  * @returns Cached data ya network se fetched data.
//  */
// async function createCachedApiFetcher( // 'T' generic type parameter hata diya gaya hai
//   cacheKey: string,
//   fetcher: () => Promise<FetchAreasResponse> // Yahan specific response type use kiya hai
// ): Promise<FetchAreasResponse> {
//   // Pehle cache mein data check karein
//   const cachedData = apiCache[cacheKey]; // Type assertion ki zaroorat nahi kyunki CacheEntry ab specific hai

//   if (cachedData) {
//     const now = Date.now();
//     // Agar data fresh hai (CACHE_DURATION ke andar)
//     if (now - cachedData.timestamp < CACHE_DURATION) {
//       console.log(`Cache HIT for ${cacheKey}`);
//       return cachedData.data; // Cached data return karein
//     } else {
//       console.log(`Cache EXPIRED for ${cacheKey}`);
//       delete apiCache[cacheKey]; // Expired entry hata dein
//     }
//   }

//   console.log(`Cache MISS for ${cacheKey}. Fetching from network.`);
//   // Agar cache mein nahi hai ya expired hai, toh network call karein
//   try {
//     const responseData = await fetcher(); // Actual API fetcher function ko call karein

//     // Agar API call successful hai, toh data ko cache karein
//     if (responseData.success) {
//       apiCache[cacheKey] = {
//         data: responseData,
//         timestamp: Date.now(),
//       };
//       console.log(`Data cached for ${cacheKey}`);
//     }
//     return responseData; // Network se aaya hua data return karein
//   } catch (error) {
//     console.error(`Error fetching data for ${cacheKey}:`, error);
//     // Error ko re-throw karein ya ek consistent error response return karein
//     return { success: false, message: (error as Error).message || 'An unknown error occurred.', data: [] };
//   }
// }

// /**
//  * Function to fetch all available areas from the backend API. Caching applied.
//  * @returns API response in FetchAreasResponse format.
//  */
// export const fetchAreas = async (): Promise<FetchAreasResponse> => {
//   return createCachedApiFetcher(
//     'allAreas', // Areas ke liye unique cache key
//     async () => {
//       try {
//         const response = await fetch(`${API_BASE_URL}/areas`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         });

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data.message || `HTTP error! Status: ${response.status}`);
//         }

//         return { success: true, message: data.message, data: data.data };
//       } catch (error: any) {
//         console.error("Error fetching areas from network:", error);
//         return { success: false, message: error.message || 'Failed to fetch areas from network.', data: [] };
//       }
//     }
//   );
// };