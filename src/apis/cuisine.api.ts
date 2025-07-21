// // src/apis/cuisine.api.ts

// const BASE_URL = import.meta.env.VITE_LOCAL_URL; // Assuming VITE_LOCAL_URL is set in your .env file

// // Define the interface for a single cuisine object
// export interface Cuisine {
//   id: string;
//   cuisineName: string;
//   imageUrl: string;
// }

// // Define the interface for the API response structure
// export interface FetchCuisinesResponse {
//   success: boolean;
//   message: string;
//   data: Cuisine[];
// }

// const CACHE_KEY = 'cachedCuisines';
// const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// export const fetchCuisines = async (): Promise<FetchCuisinesResponse> => {
//   const cachedData = localStorage.getItem(CACHE_KEY);
//   const cachedTimestamp = localStorage.getItem(`${CACHE_KEY}_timestamp`);

//   // Check if cached data exists and is not expired
//   if (cachedData && cachedTimestamp) {
//     const now = new Date().getTime();
//     if (now - parseInt(cachedTimestamp) < CACHE_DURATION_MS) {
//       console.log('Fetching cuisines from cache.');
//       return JSON.parse(cachedData) as FetchCuisinesResponse;
//     } else {
//       console.log('Cached cuisines expired, fetching new data.');
//       localStorage.removeItem(CACHE_KEY);
//       localStorage.removeItem(`${CACHE_KEY}_timestamp`);
//     }
//   }

//   console.log('Fetching cuisines from API.');
//   try {
//     const response = await fetch(`${BASE_URL}/cuisines`);
//     const data: FetchCuisinesResponse = await response.json();

//     if (data.success) {
//       // Cache the new data and timestamp
//       localStorage.setItem(CACHE_KEY, JSON.stringify(data));
//       localStorage.setItem(`${CACHE_KEY}_timestamp`, new Date().getTime().toString());
//     } else {
//       console.error("Failed to fetch cuisines from API:", data.message);
//     }
//     return data;
//   } catch (error) {
//     console.error("Error fetching cuisines:", error);
//     return { success: false, message: "Network error or API is down.", data: [] };
//   }
// };


// src/apis/cuisine.api.ts

const BASE_URL = import.meta.env.VITE_LOCAL_URL; // Assuming VITE_LOCAL_URL is set in your .env file

// Define the interface for a single cuisine object
export interface Cuisine {
  id: string;
  cuisineName: string;
  imageUrl: string;
}

// Define the interface for the API response structure
export interface FetchCuisinesResponse {
  success: boolean;
  message: string;
  data: Cuisine[];
}

// NEW: Interface for the structure of data stored in localStorage
interface CachedCuisines {
  data: Cuisine[];
  timestamp: number;
}

const CACHE_KEY = 'cachedCuisines';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const fetchCuisines = async (): Promise<FetchCuisinesResponse> => {
  const cachedEntryString = localStorage.getItem(CACHE_KEY);

  // Check if cached data exists and is not expired
  if (cachedEntryString) {
    try {
      const cachedEntry: CachedCuisines = JSON.parse(cachedEntryString);
      const now = new Date().getTime();

      if (now - cachedEntry.timestamp < CACHE_DURATION_MS) {
        console.log('Fetching cuisines from cache.');
        // Return the cached data wrapped in the FetchCuisinesResponse format
        return { success: true, message: 'Fetched from cache', data: cachedEntry.data };
      } else {
        console.log('Cached cuisines expired, fetching new data.');
        localStorage.removeItem(CACHE_KEY); // Clear expired cache
      }
    } catch (e) {
      console.error("Error parsing cached cuisines, fetching new data:", e);
      localStorage.removeItem(CACHE_KEY); // Clear corrupted cache
    }
  }

  console.log('Fetching cuisines from API.');
  try {
    const response = await fetch(`${BASE_URL}/cuisines`);
    const data: FetchCuisinesResponse = await response.json();

    if (data.success) {
      // NEW: Cache the cuisines data along with the current timestamp in a single entry
      const cacheData: CachedCuisines = {
        data: data.data,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } else {
      console.error("Failed to fetch cuisines from API:", data.message);
    }
    return data;
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    return { success: false, message: "Network error or API is down.", data: [] };
  }
};