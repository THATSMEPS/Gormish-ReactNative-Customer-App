import { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant.types'; 
import { RestaurantCard } from './RestaurantCard';
import { fetchRestaurants } from '../apis/restaurant.api';
import { fetchCustomerById } from '../apis/customer.api'; // Import fetchCustomerById

interface Props {
  selectedArea: string;
  // This prop will now receive EITHER a top-level category OR a cuisine filter
  selectedCategory: string | null; 
  onRestaurantClick: (restaurant: Restaurant) => void;
  searchText: string;
}

export const RestaurantGrid = ({ selectedArea, selectedCategory, onRestaurantClick, searchText }: Props) => { 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allRestaurants, setAllRestaurants] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);
  const [filteredData, setFilteredData] = useState<(Restaurant & { isCurrentlyOpen: boolean })[]>([]);

  // New state for customer details
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const checkRestaurantIsOpen = (restaurant: Restaurant): boolean => {
    if (typeof restaurant.isOpen === 'boolean') {
      return restaurant.isOpen;
    }
    console.warn(`Restaurant "${restaurant.name}" has an invalid or missing top-level 'isOpen' property. Assuming closed.`);
    return false;
  };

  useEffect(() => {
    const getRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchRestaurants(); 
        if (!response.success) {
          throw new Error(response.message);
        }
        
        const restaurantsWithStatus = response.data.map(restaurant => ({
          ...restaurant,
          cuisines: restaurant.cuisines || 'No cuisines listed',
          address: restaurant.address || { street: 'No address', city: '', state: '', pincode: '' },
          area: restaurant.area || { id: '', pincode: 0, areaName: 'Unknown Area', cityName: '', stateName: '', latitude: 0, longitude: 0 },
          isCurrentlyOpen: checkRestaurantIsOpen(restaurant)
        }));
        setAllRestaurants(restaurantsWithStatus);
      } catch (err) {
        console.error("Error in RestaurantGrid fetching restaurants:", err);
        setError(err instanceof Error ? err.message : 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    getRestaurants();
  }, []);

  // New useEffect to fetch customer details after login/signup
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setCustomerLoading(true);
      setCustomerError(null);
      try {
        const customerDataString = localStorage.getItem('customerData');
        if (!customerDataString) {
          setCustomerLoading(false);
          return;
        }
        const customerData = JSON.parse(customerDataString);
        if (!customerData || !customerData.id) {
          setCustomerLoading(false);
          return;
        }
        const response = await fetchCustomerById(customerData.id);
        if (!response.success) {
          throw new Error(response.message);
        }
        setCustomerDetails(response.data);
        // Update localStorage with fresh customer data
        localStorage.setItem('customerData', JSON.stringify(response.data));
      } catch (err) {
        console.error("Error fetching customer details:", err);
        setCustomerError(err instanceof Error ? err.message : 'Failed to fetch customer details');
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomerDetails();
  }, []);

  // This useEffect now handles filtering based on selectedArea, selectedCategory (which can be a cuisine filter), and searchText
  useEffect(() => {
    let currentFilteredRestaurants = [...allRestaurants]; 
    const lowerCaseSearchText = searchText.toLowerCase().trim(); 

    // First, filter by selectedArea
    if (selectedArea && selectedArea.toLowerCase() !== 'all') {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => 
        restaurant.area?.areaName.toLowerCase() === selectedArea.toLowerCase()
      );
    }

    // Then, filter by selectedCategory (this now handles cuisine filtering too)
    // Only apply category filter if selectedCategory is not null or empty
    if (selectedCategory) {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
        // Ensure cuisines is a string, then split and check for inclusion
        const cuisinesString = restaurant.cuisines || '';
        const cuisinesArray = cuisinesString.split(',').map(c => c.trim().toLowerCase());
        return cuisinesArray.includes(selectedCategory.toLowerCase());
      });
    }
    
    // Filter by search text (restaurant name or cuisine) - applies after area and category filters
    if (lowerCaseSearchText) {
      currentFilteredRestaurants = currentFilteredRestaurants.filter(restaurant => {
        const restaurantNameMatches = restaurant.name.toLowerCase().includes(lowerCaseSearchText);
        
        const cuisineMatches = (restaurant.cuisines?.split(',') || [])
          .map(c => c.trim().toLowerCase())
          .some(cuisine => cuisine.includes(lowerCaseSearchText));

        return restaurantNameMatches || cuisineMatches;
      });
    }

    setFilteredData(currentFilteredRestaurants);
  }, [allRestaurants, selectedArea, selectedCategory, searchText]); // Dependency array updated

  const openRestaurants = filteredData.filter(restaurant => restaurant.isCurrentlyOpen);
  const closedRestaurants = filteredData.filter(restaurant => !restaurant.isCurrentlyOpen);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
        {[1, 2, 3, 4].map((_, index) => (
          <div key={index} className="aspect-[1.8/1] rounded-[25px] bg-white shimmer" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (selectedArea === " ") {
    return (
      <div className="text-center py-8 text-gray-500">
        Fetching restaurants in your area...
      </div>
    );
  }

  if (openRestaurants.length === 0 && closedRestaurants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No restaurants found {selectedCategory ? `for category "${selectedCategory}"` : ''} in {selectedArea} {searchText ? `for "${searchText}"` : ''}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-8">
      {openRestaurants.length > 0 && (
        <>
          {openRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isCurrentlyOpen={restaurant.isCurrentlyOpen}
              onClick={() => onRestaurantClick(restaurant)}
            />
          ))}
        </>
      )}

      {openRestaurants.length > 0 && closedRestaurants.length > 0 && (
        <div className="col-span-full mt-4 border-t border-gray-300 pt-4"></div>
      )}

      {closedRestaurants.length > 0 && (
        <>
          {closedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isCurrentlyOpen={restaurant.isCurrentlyOpen}
              onClick={() => onRestaurantClick(restaurant)}
            />
          ))}
        </>
      )}
    </div>
  );
};
