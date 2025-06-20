

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Minus, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { LocationPopup } from "./LocationPopup";
import { Restaurant, MenuItem } from "../types/restaurant.types";
import { placeOrder } from "../apis/order.api";
import {
  AddonPayload,
  OrderItemPayload,
  PlaceOrderPayload,
} from "../types/order.types";
import { useNavigate } from "react-router-dom";
import { Customer } from "../types/customer.types";
import { fetchCustomerById } from "../apis/customer.api";
import { fetchAreas } from "../apis/area.api";
import { Area } from "../types/area.types";
import {getDistance} from 'geolib';
import { PaymentSuccessScreen } from "../components/PaymentSuccessScreen";

// ✅ NEW: Simple Error Popup Component (inline to avoid new file creation)
// This will display messages like "Our all delivery partners are busy right now!"
const ErrorPopup = ({ message, onClose }: { message: string; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" // Higher z-index
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center mx-4 space-y-4"
      >
        <h3 className="text-xl font-bold text-red-600">Oops!</h3>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};


interface BillingScreenProps {
  restaurant: Restaurant;
  items: Record<string, number>;
  itemTotal: number;
  onBack: () => void;
  onUpdateCart: (itemId: string, increment: boolean) => void;
  menuItems: MenuItem[];
  selectedAddons: Record<string, string[]>; // Prop for selected addons
}

export const BillingScreen = ({
  restaurant,
  items,
  itemTotal,
  onBack,
  onUpdateCart,
  menuItems,
  selectedAddons, // Destructure new prop
}: BillingScreenProps) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // ✅ NEW STATES: For the custom error popup
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');


  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [orderPlacementLoading, setOrderPlacementLoading] = useState(false);
  const [orderPlacementError, setOrderPlacementError] = useState<string | null>(
    null
  );

  const [customerData, setCustomerData] = useState<Customer | null>(() => {
    const storedCustomer = localStorage.getItem("customerData");
    return storedCustomer ? JSON.parse(storedCustomer) : null;
  });
  const [availableAreas, setAvailableAreas] = useState<Area[]>(() => {
    const storedAreas = localStorage.getItem("availableAreas");
    return storedAreas ? JSON.parse(storedAreas) : [];
  });

  let CUSTOMER_ID = "";
  const localStorageCustomerId = localStorage.getItem("customerId");
  if (localStorageCustomerId) {
    CUSTOMER_ID = localStorageCustomerId;
  }

  const restaurantLocation = localStorage.getItem('restaurantLocation')
  let distance = null;
  if(restaurantLocation && customerData) {
    const restaurantLocationLatitude = JSON.parse(restaurantLocation).latitude
    const restaurantLocationLongitude = JSON.parse(restaurantLocation).longitude
    const customerLocationLatitude = customerData.address.latitude
    const customerLocationLongitude = customerData.address.longitude

    distance = getDistance(
      {latitude: restaurantLocationLatitude, longitude: restaurantLocationLongitude},
      {latitude: customerLocationLatitude, longitude: customerLocationLongitude}
    ) // gives in meters

    distance = parseFloat((distance/1000).toFixed(2)); // converts in to km
  }


  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchCustomerAndAreas = useCallback(async () => {
    try {
      const customerResponse = await fetchCustomerById(CUSTOMER_ID);
      if (customerResponse.success && customerResponse.data) {
        setCustomerData(customerResponse.data);
        localStorage.setItem(
          "customerData",
          JSON.stringify(customerResponse.data)
        );
        if (customerResponse.data.area?.areaName) {
          localStorage.setItem(
            "selectedArea",
            customerResponse.data.area.areaName
          );
        }
      } else {
        console.error(
          "Failed to fetch customer data in BillingScreen:",
          customerResponse.message
        );
        setCustomerData(null);
        localStorage.removeItem("customerData");
      }
    } catch (error) {
      console.error("Error fetching customer data in BillingScreen:", error);
      setCustomerData(null);
      localStorage.removeItem("customerData");
    }

    try {
      const areasResponse = await fetchAreas();
      if (areasResponse.success && areasResponse.data) {
        setAvailableAreas(areasResponse.data);
        localStorage.setItem(
          "availableAreas",
          JSON.stringify(areasResponse.data)
        );
      } else {
        console.error(
          "Failed to fetch areas in BillingScreen:",
          areasResponse.message
        );
        setAvailableAreas([]);
        localStorage.removeItem("availableAreas");
      }
    } catch (error) {
      console.error("Error fetching areas in BillingScreen:", error);
      setAvailableAreas([]);
      localStorage.removeItem("availableAreas");
    }
  }, [CUSTOMER_ID]); // Added CUSTOMER_ID as dependency

  useEffect(() => {
    if (!customerData || availableAreas.length === 0) {
      fetchCustomerAndAreas();
    }
  }, [customerData, availableAreas, fetchCustomerAndAreas]);

  const handleAreaSelect = useCallback(
    async (newAreaName: string) => {
      console.log(
        `Area selected in popup: ${newAreaName}. Re-fetching customer data and updating localStorage...`
      );
      await fetchCustomerAndAreas();
      setShowLocationPopup(false);
    },
    [fetchCustomerAndAreas]
  );

  const calculateGST = () => {
    const gstRate = parseFloat(restaurant.applicableTaxBracket || "0");
    const gstAmount = itemTotal * (gstRate / 100);
    return parseFloat(gstAmount.toFixed(2));
  };

  const gstTotal = calculateGST();

  const calculateTotalAmount = () => {
    return parseFloat((itemTotal + gstTotal).toFixed(2));
  };

  const totalAmount = calculateTotalAmount();

  const handlePlaceOrder = async () => {
    setOrderPlacementLoading(true);
    setOrderPlacementError(null);
    setShowErrorPopup(false); // ✅ Clear previous popup error
    setErrorMessage(''); // ✅ Clear previous error message

    // Ensure customerData is available before proceeding
    if (!customerData) {
      setOrderPlacementError(
        "Customer data is not available. Please try again."
      );
      setOrderPlacementLoading(false);
      return;
    }

    const customerId = CUSTOMER_ID;
    const estimatedDistance = 3.7; // Hardcoded, ideally dynamic

    // Order items payload banate samay `base_price` aur `total_addon_price` ko calculate karein
    const orderItemsPayload: OrderItemPayload[] = Object.entries(items).map(
      ([menuItemId, quantity]) => {
        const item = menuItems.find((mi) => mi.id === menuItemId);

        // Agar item nahi mila toh warning aur default values ke saath return karein
        if (!item) {
          console.warn(
            `Menu item with ID ${menuItemId} not found in menuItems. Returning default values.`
          );
          return {
            menuItemId: menuItemId, // Backend expects menuItemId
            quantity: quantity,
            base_price: 0,
            item_addons: [],
            total_addon_price: 0,
          };
        }

        const selectedAddonNames = selectedAddons[menuItemId] || [];
        let currentItemTotalAddonPrice = 0; // Ek single unit of item ke liye addons ka total price

        // Addons payload banate samay, AddonPayload ke sabhi fields include karein
        const addonsPayload: AddonPayload[] = selectedAddonNames.map(
          (addonName) => {
            const addonDetail = item.addons?.find((a) => a.name === addonName);

            if (!addonDetail || !addonDetail.available) {
              // Selected addon detail nahi mili ya available nahi hai, warning log karein
              console.warn(
                `Selected addon "${addonName}" for menuItemId "${menuItemId}" not found or unavailable. Returning fallback.`
              );
              return { name: addonName, isAvailable: false, extraPrice: 0 }; // Fallback with 0 price if not found/available
            }

            // Agar addon available hai, toh uski price currentItemTotalAddonPrice mein add karein (for one unit)
            currentItemTotalAddonPrice += addonDetail.extraPrice;

            return {
              name: addonDetail.name,
              isAvailable: addonDetail.available,
              extraPrice: addonDetail.extraPrice,
            };
          }
        );

        const basePriceValue = parseFloat(item.discountedPrice || item.price);
        // item_total_price database backend se calculate hoga (base_price + total_addon_price) * quantity
        // Ab hum `item_total_price` ko yahan se nahi bhejenge, backend handle karega

        return {
          menuItemId: menuItemId, // Changed from item_id to menuItemId as per backend error
          quantity: quantity,
          base_price: parseFloat(basePriceValue.toFixed(2)), // Menu item ka base price (e.g., "13" for pizza)
          item_addons: addonsPayload, // Selected addons ka array, jo JSON format mein store hoga
          total_addon_price: parseFloat(currentItemTotalAddonPrice.toFixed(2)), // Ek item unit ke selected addons ka total price
        };
      }
    );

    let customerAddress: string = "";
    const localStorageAddress = localStorage.getItem("customerData");
    if (localStorageAddress) {
      // ✅ Original logic for customerAddress (as requested, not changing)
      customerAddress = JSON.parse(localStorageAddress).address;
    }

    const orderPayload: PlaceOrderPayload = {
      // Type assertion for PlaceOrderPayload
      restaurantId: restaurant.id, // r_id
      customerId: customerId, // c_id
      items: orderItemsPayload, // order_items table ki details
      paymentType: paymentMethod, // payment_type
      customerNotes: customerNotes, // r_notes_by_customer
      distance: distance? distance : estimatedDistance, // order_distance
      orderType: "delivery", // order_type
      address: customerAddress || "Customer address not found", // customerAddress
      // sum_of_items_amount, gst, total_amount, delivery_fee will be calculated by backend
    };

    console.log("Order Payload being sent:", orderPayload); // Debugging ke liye payload print karein

    try {
      const result = await placeOrder(orderPayload);

      if (result.success && result.orderId) {
        // navigate(`/order/${result.orderId}`); // Original navigation
        setShowPaymentSuccess(true); // Original success screen logic
        setTimeout(() => {
          navigate(`/order/${result.orderId}`); // Original navigation after timeout
        }, 3000);
      } else {
        // ✅ NEW: Handle specific backend error message with popup
        setOrderPlacementError(result.message || "Failed to place order. Order ID not received.");
        setErrorMessage(result.message || "Failed to place order. Please try again.");
        setShowErrorPopup(true); // Show the new error popup
      }
    } catch (error: any) { // Catching 'any' to safely access error.message
      console.error("Error in handlePlaceOrder:", error);
      setOrderPlacementError(
        error.message || "An unexpected error occurred while placing the order. Please check your network."
      );
      // ✅ NEW: Set error message for the popup from the caught error
      setErrorMessage(error.message || "An unexpected error occurred. Please try your order again.");
      setShowErrorPopup(true); // Show the new error popup for network/unexpected errors
    } finally {
      setOrderPlacementLoading(false);
    }
  };

  // ✅ NEW: Callback to close error popup
  const handleErrorPopupClose = useCallback(() => {
    setShowErrorPopup(false);
    setErrorMessage('');
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] p-4 space-y-4">
        <div className="h-12 w-12 shimmer rounded-full" />
        <div className="h-12 w-full shimmer rounded-[25px]" />
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full shimmer rounded-[25px]" />
          ))}
        </div>
      </div>
    );
  }

  // Determine current display area name
  // const currentAreaDisplayName = customerData?.area?.areaName || 'Loading Area...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F2F2F5]"
    >
      <LocationPopup
        isOpen={showLocationPopup}
        onClose={() => setShowLocationPopup(false)}
        onAreaSelect={handleAreaSelect}
        initialCustomerData={customerData}
        initialAvailableAreas={availableAreas}
        disableAreaSelection={true}
      />

      <div className="bg-white py-4 px-4 flex items-center gap-4">
        <button onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">Checkout</h1>
      </div>

      <div className="px-4 py-4">
        <div className="bg-white rounded-[25px] p-4">
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {Object.entries(items).map(([itemId, quantity]) => {
              const item = menuItems.find((menuItem) => menuItem.id === itemId);
              if (!item) return null;

              // Filter selected addons for this specific item
              const addonsForThisItem = selectedAddons[itemId] || [];
              const selectedAddonDetails =
                item.addons?.filter((addon) =>
                  addonsForThisItem.includes(addon.name)
                ) || [];

              return (
                <div key={itemId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="w-4 h-4">
                          <img
                            src={
                              restaurant.vegNonveg === "veg"
                                ? "../../public/assets/veg.png" // Yahan apni veg image ka URL paste karo
                                : "../../public/assets/nonveg.png" // Yahan apni non-veg image ka URL paste karo
                            }
                            alt={restaurant.vegNonveg}
                            // Optional: Agar image load na ho toh fallback placeholder image
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/24x24/cccccc/333333?text=Error";
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        ₹{item.discountedPrice || item.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateCart(itemId, false)}
                        className="w-8 h-8 rounded-full bg-[#6552FF]/10 flex items-center justify-center"
                      >
                        <Minus size={16} className="text-[#6552FF]" />
                      </button>
                      <span className="w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => onUpdateCart(itemId, true)}
                        className="w-8 h-8 rounded-full bg-[#6552FF]/10 flex items-center justify-center"
                      >
                        <Plus size={16} className="text-[#6552FF]" />
                      </button>
                    </div>
                  </div>
                  {selectedAddonDetails.length > 0 && (
                    <div className="ml-6 mt-1 text-xs text-gray-600">
                      {selectedAddonDetails.map((addon) => (
                        <p key={addon.name}>
                          + {addon.name} (₹{addon.extraPrice.toFixed(2)})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-[25px] p-4">
          <h3 className="font-semibold mb-4">Customer Notes (Optional)</h3>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="e.g., No plastic cutlery, make it spicy..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6552FF] resize-none"
          ></textarea>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div
          className="bg-white rounded-[25px] py-3 px-4 flex items-center justify-between cursor-pointer"
          onClick={() => setShowLocationPopup(true)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin size={16} className="text-black/70 flex-shrink-0" />
            <span className="text-xs font-light text-black/80 truncate mr-5">
              {customerData?.address
                ? `${customerData.address.typedAddress} | ${customerData.area.areaName}`
                : "Loading Location..."}
            </span>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="pl-4 mt-4 w-2/5">
          <div className="bg-white rounded-[25px] p-4 h-full">
            <h3 className="font-semibold mb-2 text-center sm:text-center">
              Distance
            </h3>
            <div className="bg-[#F2F2F5] p-3 rounded-lg text-center font-medium text-gray-700">
              {distance? distance : '3.7'} km
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 w-3/5">
          <div className="bg-white rounded-[25px] p-4">
            <h3 className="font-semibold mb-2 text-center">Payment Type</h3>
            <div className="space-y-2 select-none">
              {["COD"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full p-3 rounded-lg text-center ${
                    paymentMethod === method
                      ? "bg-[#6552FF]/10 text-[#6552FF] font-medium"
                      : "hover:bg-gray-50"
                  }`}
                >
                  COD / UPI
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-24">
        <div className="bg-white rounded-[25px] p-4">
          <h3 className="font-semibold mb-4">Bill Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Item Total</span>
              <span>₹{itemTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST ({restaurant.applicableTaxBracket}%)</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          {orderPlacementError && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {orderPlacementError}
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handlePlaceOrder}
          disabled={!paymentMethod || orderPlacementLoading}
          className={`w-full py-3 px-4 rounded-[25px] text-white font-medium ${
            paymentMethod && !orderPlacementLoading
              ? "bg-[#6552FF]"
              : "bg-gray-300"
          }`}
        >
          {orderPlacementLoading
            ? "Placing Order..."
            : `Place Order • ₹${totalAmount.toFixed(2)}`}
        </button>
      </div>
      {showPaymentSuccess && (
        <PaymentSuccessScreen onContinue={() => {}} />
      )}

      {/* ✅ NEW: Error Popup Render */}
      {showErrorPopup && (
        <ErrorPopup message={errorMessage} onClose={handleErrorPopupClose} />
      )}
    </motion.div>
  );
};
