import { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Plus, Minus, X } from "lucide-react"; // Import X icon
import { FaStar } from "react-icons/fa";
import { Restaurant, MenuItem } from "../types/restaurant.types";
import { BillingScreen } from "./BillingScreen";
import { fetchRestaurantMenu } from "../apis/restaurant.api";
import clsx from 'clsx'; // Import clsx for conditional class names

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  onOrder?: (orderId: string) => void;
}

export const RestaurantPage = ({ restaurant, onBack }: Props) => {
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<
    Record<string, string[]>
  >({});
  const [showBilling, setShowBilling] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [showAddonsPopup, setShowAddonsPopup] = useState(false);
  const [selectedItemForAddonsPopup, setSelectedItemForAddonsPopup] = useState<MenuItem | null>(null);

  // NEW STATE: To manage the currently selected cuisine filter for menu items
  const [selectedMenuItemCuisineFilter, setSelectedMenuItemCuisineFilter] = useState<string | null>(null);

  const resturantLocation = {
    latitude: `${restaurant.area.latitude}`,
    longitude: `${restaurant.area.longitude}`
  }

  localStorage.setItem('restaurantLocation', JSON.stringify(resturantLocation))

  // Parse restaurant cuisines string into an array for filter tabs
  const restaurantCuisines = useMemo(() => {
    if (!restaurant || !restaurant.cuisines) return [];
    return restaurant.cuisines.split(',').map(c => c.trim()).filter(c => c);
  }, [restaurant.cuisines]);

  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setMenuLoading(false);
      return;
    }

    setMenuLoading(true);
    setMenuError(null);
    const getRestaurantMenu = async () => {
      try {
        const response = await fetchRestaurantMenu(restaurant.id);
        if (!response.success) {
          throw new Error(response.message);
        }
        setMenuItems(response.data);
      } catch (err) {
        console.error("Error fetching restaurant menu:", err);
        setMenuError(
          err instanceof Error ? err.message : "Failed to load menu items."
        );
      } finally {
        setMenuLoading(false);
      }
    };

    getRestaurantMenu();
  }, [restaurant?.id]);

  const totalItems = Object.values(cartItems).reduce(
    (sum, count) => sum + count,
    0
  );

  const updateCart = (itemId: string, increment: boolean) => {
    const item = menuItems.find((menuItem) => menuItem.id === itemId);
    if (!item || !item.isAvailable) {
      console.warn(
        `Attempted to update cart for unavailable item: ${item?.name || itemId}`
      );
      return;
    }

    setCartItems((prev) => {
      const currentCount = prev[itemId] || 0;
      const newCount = increment
        ? currentCount + 1
        : Math.max(0, currentCount - 1);

      if (newCount === 0) {
        setSelectedAddons((prevAddons) => {
          const { [itemId]: _, ...rest } = prevAddons;
          return rest;
        });
        if (selectedItemForAddonsPopup?.id === itemId) {
            setShowAddonsPopup(false);
            setSelectedItemForAddonsPopup(null);
        }

        const { [itemId]: _, ...rest } = prev;
        if (Object.keys(rest).length === 0 && showBilling) {
          setShowBilling(false);
        }
        return rest;
      }

      if (increment && item.addons && item.addons.length > 0) {
          setSelectedItemForAddonsPopup(item);
          setShowAddonsPopup(true);
      } else if (increment && (!item.addons || item.addons.length === 0)) {
          setShowAddonsPopup(false);
          setSelectedItemForAddonsPopup(null);
      }

      return {
        ...prev,
        [itemId]: newCount,
      };
    });
  };

  const handleAddonSelection = (
    menuItemId: string,
    addonName: string,
    isChecked: boolean
  ) => {
    setSelectedAddons((prev) => {
      const currentAddons = prev[menuItemId] || [];
      if (isChecked) {
        return {
          ...prev,
          [menuItemId]: [...new Set([...currentAddons, addonName])],
        };
      } else {
        return {
          ...prev,
          [menuItemId]: currentAddons.filter((name) => name !== addonName),
        };
      }
    });
  };

  const getTotalAmount = useMemo(() => {
    if (!menuItems.length) return 0;

    let total = 0;

    Object.entries(cartItems).forEach(([itemId, quantity]) => {
      const item = menuItems.find((menuItem) => menuItem.id === itemId);
      if (item && item.isAvailable) {
        const itemPrice = parseFloat(item.discountedPrice || item.price);
        total += itemPrice * quantity;

        const addonsForThisItem = selectedAddons[itemId] || [];
        addonsForThisItem.forEach((addonName) => {
          const addon = item.addons?.find(
            (a) => a.name === addonName && a.available
          );
          if (addon) {
            total += addon.extraPrice * quantity;
          }
        });
      }
    });

    return parseFloat(total.toFixed(2));
  }, [cartItems, selectedAddons, menuItems]);

  // NEW: Handler for cuisine filter clicks
  const handleCuisineFilterClick = useCallback((cuisineName: string) => {
    // If the clicked cuisine is already selected, deselect it
    if (selectedMenuItemCuisineFilter === cuisineName) {
      setSelectedMenuItemCuisineFilter(null);
    } else {
      // Otherwise, select the new cuisine
      setSelectedMenuItemCuisineFilter(cuisineName);
    }
  }, [selectedMenuItemCuisineFilter]);

  // NEW: Filter menu items based on selectedMenuItemCuisineFilter
  const filteredMenuItems = useMemo(() => {
    let itemsToFilter = menuItems;

    if (selectedMenuItemCuisineFilter) {
      itemsToFilter = itemsToFilter.filter(item => 
        item.cuisine?.toLowerCase() === selectedMenuItemCuisineFilter.toLowerCase()
      );
    }
    return itemsToFilter;
  }, [menuItems, selectedMenuItemCuisineFilter]);

  // Use the filtered menu items for available/unavailable lists
  const availableItems = filteredMenuItems.filter(item => item.isAvailable);
  const unavailableItems = filteredMenuItems.filter(item => !item.isAvailable);


  if (showBilling) {
    return (
      <BillingScreen
        restaurant={restaurant}
        items={cartItems}
        menuItems={menuItems}
        selectedAddons={selectedAddons}
        itemTotal={getTotalAmount}
        onBack={() => setShowBilling(false)}
        onUpdateCart={updateCart}
      />
    );
  }

  if (menuLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="h-48 bg-white rounded-[25px] shimmer" />
          <div className="h-24 bg-white rounded-[25px] shimmer" />
          <div className="h-16 bg-white rounded-[25px] shimmer" />
          <div className="h-32 bg-white rounded-[25px] shimmer" />
          <p className="text-gray-500 text-center">Loading menu items...</p>
        </div>
      </div>
    );
  }

  if (menuError) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{menuError}</p>
          <button onClick={onBack} className="text-[#6552FF] hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] flex items-center justify-center">
        <p className="text-gray-500">Restaurant data not available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F2F2F5]"
    >
      {/* Restaurant Image Section */}
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden rounded-b-[25px]">
          {restaurant.banners && restaurant.banners.length > 0 ? (
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              src={restaurant.banners[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
              No Image Available
            </div>
          )}
        </div>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </motion.button>
      </div>

      {/* Restaurant Info Section */}
      <div className="px-4 -mt-2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[25px] p-4 mt-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-lg font-semibold">{restaurant.name}</h1>
            <div className="w-5 h-5">
              <img
                src={
                  restaurant.vegNonveg === "veg"
                    ? "../../dist/assets/veg.png"
                    : "../../dist/assets/nonveg.png"
                }
                alt={restaurant.vegNonveg}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/24x24/cccccc/333333?text=Error";
                }}
              />
            </div>
          </div>
          <p className="text-gray-400 font-thin text-xs">
            {restaurant.cuisines}
          </p>
        </motion.div>

        {/* Address Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 bg-white rounded-[25px] py-3 px-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin size={16} className="text-black/70 flex-shrink-0" />
            <span className="text-xs font-light text-black/80 truncate mr-5">
              {restaurant.address.street}, {restaurant.area.areaName},{" "}
              {restaurant.area.cityName}
            </span>
          </div>
          <div className="track-order-shine bg-[#6552FF] px-2.5 py-0.5 rounded-[5px] flex items-center gap-1 flex-shrink-0 ml-2">
            <FaStar size={12} className="text-white" />
            <span className="text-white text-xs">
              {restaurant.trusted ? "Trusted" : "Not Trusted"}
            </span>
          </div>
        </motion.div>

        {/* NEW: Cuisine Filter Bar for this Restaurant's Menu */}
        {restaurantCuisines.length > 0 && (
            <div className="px-0 mt-4 -mx-4"> {/* Adjusted margin for full bleed, inner padding will compensate */}
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 px-4"> {/* Added px-4 here */}
                    {restaurantCuisines.map((cuisineName) => (
                        <motion.div
                            key={cuisineName} // Using cuisineName as key
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCuisineFilterClick(cuisineName)}
                            className={clsx(
                                'relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all',
                                'flex-shrink-0', // Important for horizontal scrolling
                                selectedMenuItemCuisineFilter === cuisineName ? 'bg-[#6552FF] text-white' : 'bg-white text-black opacity-60'
                            )}
                        >
                            <span className="whitespace-nowrap font-light">
                                {cuisineName}
                            </span>
                            {/* Cross button */}
                            
                        </motion.div>
                    ))}
                </div>
            </div>
        )}

        {/* Menu Items */}
        <div className="mt-4 space-y-4 pb-24">
          {/* Available Items Section */}
          {availableItems.length > 0 && (
            <>
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[25px] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="w-4 h-4">
                        <img
                          src={
                            restaurant.vegNonveg === "veg"
                              ? "../../dist/assets/veg.png"
                              : "../../dist/assets/nonveg.png"
                          }
                          alt={restaurant.vegNonveg}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/24x24/cccccc/333333?text=Error";
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-400 font-extralight text-xs mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6552FF] font-medium">
                        ₹{item.discountedPrice || item.price}
                      </span>
                      {cartItems[item.id] ? (
                        <div className="flex items-center gap-3 bg-[#6552FF] rounded-full px-3 py-1">
                          <button
                            onClick={() => updateCart(item.id, false)}
                            className="text-white"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-white font-medium">
                            {cartItems[item.id]}
                          </span>
                          <button
                            onClick={() => updateCart(item.id, true)}
                            className="text-white"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateCart(item.id, true)}
                          className="flex items-center gap-1 bg-[#6552FF]/15 border border-[#6552FF] rounded-full px-3 py-0.5"
                        >
                          <span className="text-[#6552FF] font-medium text-sm">
                            ADD
                          </span>
                          <Plus size={12} className="text-[#6552FF] font-bold" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Unavailable Items Section */}
          {unavailableItems.length > 0 && (
            <>
              {availableItems.length > 0 && <div className="mt-8 mb-4 border-t border-gray-300 pt-4"></div>} {/* Separator if both exist */}
              <div className="space-y-4">
                {unavailableItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[25px] p-4 opacity-50 grayscale pointer-events-none cursor-not-allowed" // Always apply styles for unavailable
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="w-4 h-4">
                        <img
                          src={
                            restaurant.vegNonveg === "veg"
                              ? "../../dist/assets/veg.png"
                              : "../../dist/assets/nonveg.png"
                          }
                          alt={restaurant.vegNonveg}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/24x24/cccccc/333333?text=Error";
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-400 font-extralight text-xs mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6552FF] font-medium">
                        ₹{item.discountedPrice || item.price}
                      </span>
                      <span className="text-red-500 text-sm font-medium px-3 py-0.5 rounded-full border border-red-500">
                        Unavailable
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {availableItems.length === 0 && unavailableItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No menu items available for this restaurant.
            </div>
          )}
        </div>
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        <div className="flex justify-center h-10">
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-4 left-4 right-4 bg-[#6552FF] rounded-[25px] p-4 text-white flex items-center justify-between hover:cursor-pointer z-50"
              onClick={() => setShowBilling(true)}
            >
              <div>
                <span className="font-medium">{totalItems} Items</span>
                <span className="text-white/70"> | </span>
                <span className="font-light">₹{getTotalAmount}</span>
              </div>
              <motion.div
                whileHover={{ x: 5 }}
                whileTap={{ x: -2 }}
                className="flex items-center gap-2"
              >
                <span>View Cart</span>
                <ArrowLeft size={20} className="rotate-180" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Addons Popup */}
      <AnimatePresence>
        {showAddonsPopup && selectedItemForAddonsPopup && (
          <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[25px] shadow-2xl flex flex-col p-6"
              style={{
                width: "80dvw",
                height: "70dvh",
                background: "rgba(242, 242, 245, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Select Addons
                </h2>
                <button
                  onClick={() => {
                    setShowAddonsPopup(false);
                    setSelectedItemForAddonsPopup(null);
                  }}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
                {selectedItemForAddonsPopup.addons &&
                selectedItemForAddonsPopup.addons.length > 0 ? (
                  <div
                    key={selectedItemForAddonsPopup.id}
                    className="bg-white rounded-[20px] p-4 shadow-sm"
                  >
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      {selectedItemForAddonsPopup.name} (x
                      {cartItems[selectedItemForAddonsPopup.id]}){" "}
                      <div className="w-4 h-4">
                        <img
                          src={
                            restaurant.vegNonveg === "veg"
                              ? "../../dist/assets/veg.png"
                              : "../../dist/assets/nonveg.png"
                          }
                          alt={restaurant.vegNonveg}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/24x24/cccccc/333333?text=Error";
                          }}
                        />
                      </div>
                    </h3>
                    <div className="space-y-3">
                      {selectedItemForAddonsPopup.addons.map((addon) => (
                        <div
                          key={addon.name}
                          className={`flex justify-between items-center py-2 px-3 rounded-lg border ${
                            !addon.available
                              ? "bg-gray-100 border-gray-200 opacity-50 grayscale pointer-events-none cursor-not-allowed"
                              : "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <label
                            className={`flex items-center justify-between flex-grow ${
                              !addon.available ? "pointer-events-none" : ""
                            }`}
                          >
                            <span className="font-light text-gray-700">
                              {addon.name} (+₹{addon.extraPrice.toFixed(2)})
                            </span>
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-[#6552FF] rounded focus:ring-[#6552FF]"
                              checked={
                                selectedAddons[selectedItemForAddonsPopup.id]?.includes(
                                  addon.name
                                ) || false
                              }
                              onChange={(e) =>
                                handleAddonSelection(
                                  selectedItemForAddonsPopup.id,
                                  addon.name,
                                  e.target.checked
                                )
                              }
                              disabled={!addon.available}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No addons available for this item.
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddonsPopup(false);
                  setSelectedItemForAddonsPopup(null);
                }}
                className={`mt-6 w-full rounded-full py-3 font-semibold transition-colors
                  ${
                    selectedAddons[selectedItemForAddonsPopup?.id || ''] &&
                    selectedAddons[selectedItemForAddonsPopup?.id || ''].length > 0
                      ? 'bg-[#6552FF] text-white hover:bg-opacity-90'
                      : 'bg-[#6552FF]/15 text-[#6552FF] hover:bg-[#6552FF]/25'
                  }
                `}
              >
                {selectedAddons[selectedItemForAddonsPopup?.id || ''] &&
                selectedAddons[selectedItemForAddonsPopup?.id || ''].length > 0
                  ? 'Done'
                  : 'No, Thanks'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};