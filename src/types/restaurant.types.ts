export interface Area {
  id: string;
  pincode: number;
  areaName: string;
  cityName: string;
  stateName: string;
  latitude: number;
  longitude: number;
}

export interface RestaurantHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface RestaurantAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface Addon {
  name: string;
  extraPrice: number;
  available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  discountedPrice: string | null;
  isVeg: boolean;
  packagingCharges: string;
  cuisine: string;
  createdAt: string;
  updatedAt: string;
  addons?: Addon[];
  restaurantId: string;
  isAvailable: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  createdAt: string;
  mobile: string;
  email: string;
  approval: boolean;
  cuisines: string;
  vegNonveg: 'veg' | 'nonveg' | 'both';
  applicableTaxBracket: string;
  trusted: boolean;
  hours: RestaurantHours;
  isOpen: boolean
  address: RestaurantAddress;
  banners: string[];
  areaId: string;
  area: Area;
  menu?: MenuItem[];
}

export interface RestaurantFilters {
  area_id: string;
  cuisine: string | null;
}
