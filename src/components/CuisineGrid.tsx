// components/CuisineGrid.tsx

import { useState, useEffect } from 'react';
import { CuisineCard, Cuisine } from './CuisineCard'; // Ensure correct import path and casing
import { fetchCuisines } from '../apis/cuisine.api'; // Fetching cuisines with caching

interface Props {
  // Handler for when a cuisine card is clicked (selects or deselects)
  onCuisineClick: (cuisineName: string) => void;
  // NEW: Currently selected cuisine name (passed from App.tsx)
  selectedCuisine: string | null;
}

export const CuisineGrid = ({ onCuisineClick, selectedCuisine }: Props) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);

  // useEffect hook to fetch cuisines data on component mount
  useEffect(() => {
    const getCuisines = async () => {
      try {
        setLoading(true); // Start loading state
        setError(null); // Clear any previous errors

        const response = await fetchCuisines(); // Call the API to get cuisines
        if (response.success && response.data) {
          setCuisines(response.data); // Set fetched data to state
        } else {
          // Throw an error if the API call fails
          throw new Error(response.message || 'Failed to fetch cuisines.');
        }
      } catch (err) {
        // Log and set error state
        console.error("Error fetching cuisines in CuisineGrid:", err);
        setError(err instanceof Error ? err.message : 'Failed to load cuisines.');
      } finally {
        setLoading(false); // End loading state
      }
    };

    getCuisines(); // Execute the fetch function
  }, []); // Empty dependency array means this runs only once on mount

  // UI for loading state, showing shimmer placeholders for two rows
  if (loading) {
    return (
      <div className="px-4 pb-8"> {/* Outer container for padding */}
        <div 
          className="grid grid-flow-col grid-rows-2 gap-4 overflow-x-auto overflow-y-hidden no-scrollbar auto-rows-max bg-gradient-to-r from-gray-100 via-transparent via-10% to-gray-100 to-90%"
        >
          {/* Example: 10 shimmer cards arranged to fill 2 rows horizontally */}
          {[...Array(10)].map((_, index) => (
            <div key={`shimmer-${index}`} className="w-[160px] aspect-[1.8/1] rounded-[25px] bg-white shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // UI for error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // UI if no cuisines are found after fetching
  if (cuisines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cuisines found.
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 bg-gradient-to-r from-gray-100 via-transparent via-20% to-gray-100 to-80%"> {/* Outer container for padding */}
      <div 
        className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar auto-rows-max"
        // `grid`: Enables CSS Grid layout
        // `grid-flow-col`: Fills items into columns first, then wraps to the next column (horizontally)
        // `grid-rows-2`: Explicitly defines 2 rows for items to flow into
        // `gap-4`: Adds spacing between grid items
        // `overflow-x-auto`: Enables horizontal scrolling for the entire grid container
        // `overflow-y-hidden`: Hides any potential vertical scrollbar
        // `no-scrollbar`: Custom class to hide the visual scrollbar (requires Tailwind plugin or custom CSS)
        // `auto-rows-max`: Ensures that implicitly created rows (when grid-flow-col is used) take up only as much height as their content. This makes the overall grid height dynamic.
      >
        {cuisines.map((cuisine) => (
          <div key={cuisine.id}>
            <CuisineCard
              cuisine={cuisine}
              onClick={onCuisineClick} // Pass the main click handler (App.tsx will handle toggle logic)
              isSelected={selectedCuisine === cuisine.cuisineName} // Pass selection status
            />
          </div>
        ))}
      </div>
    </div>
  );
};