export interface Order {
  id: string;
  items: Record<string, number>;
  totalAmount: number;
  status: string;
  // More fields will be added based on schema
}

export interface OrderItem {
  id: string;
  quantity: number;
  // More fields will be added based on schema
}

// Single addon structure, jo item_addons JSON mein jayegi
export interface AddonPayload {
  name: string;
  isAvailable: boolean;
  extraPrice: number;
}

// Single menu item in order payload - Updated to match backend API payload
export interface OrderItemPayload {
  menuItemId: string; // Change kiya hai: ab 'item_id' ki jagah 'menuItemId' hai
  quantity: number;
  base_price: number; // Corresponds to base_price in DB
  item_addons: AddonPayload[]; // Corresponds to item_addons json in DB
  total_addon_price: number; // Corresponds to total_addon_price in DB
}

// Full order payload structure to be sent to the backend
export interface PlaceOrderPayload {
  restaurantId: string; // r_id in DB
  customerId: string; // c_id in DB
  items: OrderItemPayload[]; // Array of OrderItemPayload
  paymentType: string; // payment_type in DB
  customerNotes?: string; // r_notes_by_customer in DB
  distance: number; // order_distance in DB
  address: string; // customer address in DB
  orderType: string; // order_type in DB
  // sum_of_items_amount, gst, total_amount, delivery_fee will be calculated on backend based on items
}

// API response structure for placing an order
export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  orderId?: string; // Order ID received from the backend
  errorCode?: string
  // Other details can be added, like order status, payment status
}

// --- NEW Interfaces for Fetching a Single Order by ID ---

export interface FetchedMenuItemDetails {
  name: string;
  description: string;
  price: string;
  discountedPrice: string | null;
  isVeg: boolean;
  packagingCharges: string;
  cuisine: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  addons: any[]; // Define more specifically if needed
  restaurantId: string;
  id: string;
}

export interface FetchedOrderItemDetails {
  quantity: number;
  basePrice: string;
  addons: any | null; // Define more specifically if needed
  totalAddonPrice: string;
  totalPrice: string;
  menuItemId: string;
  orderId: string;
  id: string;
  menuItem: FetchedMenuItemDetails; // Nested menuItem details
}

export interface FetchedRestaurantDetails {
  name: string;
  createdAt: string;
  mobile: string;
  email: string;
  password?: string; // Optional, might not be sent in fetched data
  approval: boolean;
  cuisines: string;
  vegNonveg: string;
  applicableTaxBracket: string;
  trusted: boolean;
  hours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  banners: string[];
  areaId: string;
  id: string;
}

// Full structure of a single order fetched by ID
export interface CustomerOrder {
  customerNotes: string;
  distance: string; // Coming as string from backend
  status: string | 'preparing' | 'on the way' | 'at your doorstep' | 'delivered' | 'cancelled'; // Possible statuses
  paymentType: string;
  paymentStatus: string;
  orderType: string;
  itemsAmount: string; // Coming as string from backend
  gst: string; // Coming as string from backend
  dpAcceptedAt: string | null;
  dpDeliveredAt: string | null;
  placedAt: string;
  deliveryFee: string; // Coming as string from backend
  totalAmount: string; // Coming as string from backend
  restaurantId: string;
  deliveryPartnerId: string | null;
  customerId: string;
  id: string; // This is the orderId
  items: FetchedOrderItemDetails[]; // Use the new detailed item interface
  restaurant: FetchedRestaurantDetails; // Nested restaurant details
  deliveryPartner: any | null; // Define more specifically if needed
}

// Response for fetching a single order by ID
export interface FetchOrderByIdResponse {
  success: boolean;
  message: string;
  data?: CustomerOrder; // Single CustomerOrder object
}

// Orders of particular customer fetching
export interface FetchCustomerOrdersResponse {
  success: boolean;
  message: string;
  data?: CustomerOrder[]; // Array of CustomerOrder objects as per your API response
}

export interface ReviewPayload {
    orderId: string;
    customerId: string;
    reviewText: string;
    stars: number;
}

export interface SubmitReviewResponse {
    success: boolean;
    message: string;
    reviewId?: string; // Optional review ID in case backend returns it
}

export interface OrderInReview {
    customerNotes: string;
    distance: string; // Check if number or string
    status: string;
    paymentType: string;
    paymentStatus: string;
    orderType: string;
    itemsAmount: string;
    gst: string;
    dpAcceptedAt: string | null;
    dpDeliveredAt: string | null;
    placedAt: string;
    deliveryFee: string;
    totalAmount: string;
    restaurantId: string;
    deliveryPartnerId: string | null;
    customerId: string;
    id: string;
}

export interface CustomerInReview {
    phone: string;
    email: string;
    name: string;
    createdAt: string;
    address: string;
    areaId: string;
    id: string;
}

export interface RestaurantInReview {
    name: string;
    createdAt: string;
    mobile: string;
    email: string;
    password?: string; // Optional, might not be sent in review API
    approval: boolean;
    cuisines: string;
    vegNonveg: 'veg' | 'nonveg' | 'both';
    applicableTaxBracket: string;
    trusted: boolean;
    hours: any; // Using 'any' here as its full structure might be complex and not directly needed for review display
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    banners: string[];
    areaId: string;
    id: string;
}

export interface FetchedReview {
    reviewText: string;
    stars: number | null;
    createdAt: string;
    restaurantId: string;
    deliveryPartnerId: string | null;
    customerId: string;
    orderId: string;
    id: string;
    order: OrderInReview;
    customer: CustomerInReview;
    restaurant: RestaurantInReview;
    deliveryPartner?: any; // Optional, if it's there
}

export interface FetchCustomerReviewsResponse {
    success: boolean;
    message: string;
    data?: FetchedReview[];
}

// --- NEW TYPES for Update Review API Response ---

// Rename from OrderInReview to a more generic name for reuse
export interface OrderDataForReviewResponse {
  customerNotes: string;
  distance: string;
  status: string;
  paymentType: string;
  paymentStatus: string;
  orderType: string;
  itemsAmount: string;
  gst: string;
  dpAcceptedAt: string | null;
  dpDeliveredAt: string | null;
  placedAt: string;
  deliveryFee: string;
  totalAmount: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  customerId: string;
  id: string;
}

// Rename from CustomerInReview to a more generic name for reuse
export interface CustomerDataForReviewResponse {
  phone: string;
  email: string;
  name: string;
  createdAt: string;
  address: string;
  areaId: string;
  id: string;
}

// Rename from RestaurantInReview to a more generic name for reuse
export interface RestaurantDataForReviewResponse {
  name: string;
  createdAt: string;
  mobile: string;
  email: string;
  password?: string;
  approval: boolean;
  cuisines: string;
  vegNonveg: 'veg' | 'nonveg' | 'both';
  applicableTaxBracket: string;
  trusted: boolean;
  hours: any; // Use a more specific type if possible, or leave as 'any' for now
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  banners: string[];
  areaId: string;
  id: string;
}

// FetchedReview is for GET /reviews/:customerId (list of reviews)
export interface FetchedReview {
  reviewText: string;
  stars: number | null; // Keep as number | null for display in UI
  createdAt: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  customerId: string;
  orderId: string;
  id: string;
  // Nested data might or might not be present from GET /reviews/:customerId depending on backend
  // If your fetch reviews API also returns these, you can uncomment/define them
  // order?: OrderDataForReviewResponse;
  // customer?: CustomerDataForReviewResponse;
  // restaurant?: RestaurantDataForReviewResponse;
  // deliveryPartner?: any;
}

export interface FetchCustomerReviewsResponse {
  success: boolean;
  message: string;
  data?: FetchedReview[];
}

// ✅ NEW: Payload for updating a review (same as ReviewPayload)
export type UpdateReviewPayload = ReviewPayload;

// ✅ NEW: Structure for the 'data' field in the UpdateReviewResponse
export interface UpdatedReviewData {
  reviewText: string;
  stars: string; // As per example response "4.8" (string)
  createdAt: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  customerId: string;
  orderId: string;
  id: string; // This is the actual review ID
  order: OrderDataForReviewResponse; // Reusing generic type
  customer: CustomerDataForReviewResponse; // Reusing generic type
  restaurant: RestaurantDataForReviewResponse; // Reusing generic type
  deliveryPartner: any; // Type can be more specific if structure is known
}

// ✅ NEW: Full response structure for the Update Review API
export interface UpdateReviewResponse {
  success: boolean;
  message: string;
  data?: UpdatedReviewData;
}