// types/customer.types.ts

export interface CustomerArea {
  pincode: number;
  areaName: string;
  cityName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  id: string;
}

export interface Area {
  pincode: number;
  areaName: string;
  cityName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  id: string;
}

export interface CustomerOrderSummary {
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

// --- NEW/UPDATED TYPES FOR ADDRESS ---

// This interface defines the structure of the new 'address' object
export interface StructuredCustomerAddress {
  typedAddress: string;
  longitude: number; // Geographical coordinates are numbers
  latitude: number;  // Geographical coordinates are numbers
  mappedAddress: string;
  areaId: string; // areaId is now part of the address object
}

export interface Customer {
  phone: string;
  email: string;
  name: string;
  createdAt: string;
  // ✅ UPDATED: address can now be a string OR the new structured object
  address: StructuredCustomerAddress;
  areaId: string; // Keep this for backward compatibility if needed, or remove if address.areaId is definitive
  id: string;
  area: CustomerArea;
  orders: CustomerOrderSummary[];
}

export interface FetchCustomerResponse {
  success: boolean;
  message: string;
  data?: Customer;
}

// ✅ UPDATED: The payload for updating now only contains the structured address
export interface UpdateCustomerAddressPayload {
  address: StructuredCustomerAddress;
  areaId: string
}

export interface UpdateCustomerAddressResponse {
  success: boolean;
  message: string;
  data?: Customer; // Updated customer details (with the new address structure)
}