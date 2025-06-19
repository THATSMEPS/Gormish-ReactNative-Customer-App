import { Restaurant, MenuItem, Area } from '../types/restaurant.types';

export const areas: Area[] = [
  {
    id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    pincode: 382421,
    areaName: "Kudasan",
    cityName: "Gandhinagar",
    stateName: "Gujarat",
    latitude: 23.1234,
    longitude: 72.5678
  },
  {
    id: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    pincode: 380015,
    areaName: "Navrangpura",
    cityName: "Ahmedabad",
    stateName: "Gujarat",
    latitude: 23.0333,
    longitude: 72.5667
  }
];

export const menuItems: MenuItem[] = [
  {
    id: "m1n2o3p4-q5r6-s7t8-u9v0-w1x2y3z4a5b6",
    restaurantId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Margherita Pizza",
    description: "Classic pizza with tomato sauce and mozzarella",
    price: "299.00",
    discountedPrice: null,
    isVeg: true,
    packagingCharges: "20.00",
    cuisine: "Italian",
    createdAt: "some time",
    updatedAt: "updated time",
    addons: null
  },
  {
    id: "n2o3p4q5-r6s7-t8u9-v0w1-x2y3z4a5b6c7",
    restaurantId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Pepperoni Pizza",
    description: "Classic pizza topped with pepperoni slices",
    price: "399.00",
    discountedPrice: "349.00",
    isVeg: false,
    packagingCharges: "20.00",
    cuisine: "Italian",
    createdAt: "some time",
    updatedAt: "updated time",
    addons: null
  }
];

export const dummyRestaurants: Restaurant[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Pizza Paradise",
    createdAt: new Date().toISOString(),
    mobile: "9876543210",
    email: "contact@pizzaparadise.com",
    approval: true,
    cuisines: "Italian, Pizza, Fast Food",
    vegNonveg: "both",
    applicableTaxBracket: "5",
    trusted: true,
    hours: {
      monday: "11:00 AM - 11:00 PM",
      tuesday: "11:00 AM - 11:00 PM",
      wednesday: "11:00 AM - 11:00 PM",
      thursday: "11:00 AM - 11:00 PM",
      friday: "11:00 AM - 12:00 AM",
      saturday: "11:00 AM - 12:00 AM",
      sunday: "11:00 AM - 11:00 PM"
    },
    address: {
      street: "123 Food Street",
      area: "Kudasan",
      city: "Gandhinagar",
      state: "Gujarat",
      pincode: "382421",
      latitude: 23.1234,
      longitude: 72.5678
    },
    banners: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee"
    ],
    areaId: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    area: {
      id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
      pincode: 382421,
      areaName: "Kudasan",
      cityName: "Gandhinagar",
      stateName: "Gujarat",
      latitude: 23.1234,
      longitude: 72.5678
    }
  },
  {
    id: "234f5678-f9a0-23e4-b567-537725285111",
    name: "Spice Route",
    createdAt: new Date().toISOString(),
    mobile: "9876543211",
    email: "info@spiceroute.com",
    approval: true,
    cuisines: "Indian, Chinese, Thai",
    vegNonveg: "both",
    applicableTaxBracket: "5",
    trusted: true,
    hours: {
      monday: "12:00 PM - 11:00 PM",
      tuesday: "12:00 PM - 11:00 PM",
      wednesday: "12:00 PM - 11:00 PM",
      thursday: "12:00 PM - 11:00 PM",
      friday: "12:00 PM - 12:00 AM",
      saturday: "12:00 PM - 12:00 AM",
      sunday: "12:00 PM - 11:00 PM"
    },
    address: {
      street: "456 Spice Lane",
      area: "Navrangpura",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      latitude: 23.0333,
      longitude: 72.5667
    },
    banners: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9"
    ],
    areaId: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    area: {
      id: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
      pincode: 380015,
      areaName: "Navrangpura",
      cityName: "Ahmedabad",
      stateName: "Gujarat",
      latitude: 23.0333,
      longitude: 72.5667
    }
  }
];
