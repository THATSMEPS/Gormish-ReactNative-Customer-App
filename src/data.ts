import { Category } from './types/category.types';
import { Restaurant } from './types/restaurant.types';

export const categories: Category[] = [
  { id: '1', name: 'Pizza', icon: '🍕' },
  { id: '2', name: 'Snacks', icon: '🍟' },
  { id: '3', name: 'Tacos', icon: '🌮' },
  { id: '4', name: 'Burgers', icon: '🍔' },
  { id: '5', name: 'Sushi', icon: '🍱' },
  { id: '6', name: 'Desserts', icon: '🍰' },
];

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: "Hoger's Den",
    createdAt: new Date().toISOString(),
    mobile: '9876543210',
    email: 'hogers@example.com',
    approval: true,
    cuisines: 'Pizza, Burger, Italian',
    vegNonveg: 'both',
    applicableTaxBracket: '5',
    trusted: true,
    hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '11:00 AM - 11:00 PM',
      sunday: '11:00 AM - 10:00 PM'
    },
    address: {
      street: '123 Main St',
      area: 'Kudasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382421',
      latitude: 23.1920,
      longitude: 72.6366
    },
    banners: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60'],
    areaId: '1',
    area: {
      id: '1',
      pincode: 382421,
      areaName: 'Kudasan',
      cityName: 'Gandhinagar',
      stateName: 'Gujarat',
      latitude: 23.1920,
      longitude: 72.6366
    }
  },
  {
    id: '2',
    name: 'The Rustic Kitchen',
    createdAt: new Date().toISOString(),
    mobile: '9876543211',
    email: 'rustic@example.com',
    approval: true,
    cuisines: 'Mexican, Fast Food',
    vegNonveg: 'both',
    applicableTaxBracket: '5',
    trusted: true,
    hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '11:00 AM - 11:00 PM',
      sunday: '11:00 AM - 10:00 PM'
    },
    address: {
      street: '456 Market St',
      area: 'Kudasan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382421',
      latitude: 23.1922,
      longitude: 72.6368
    },
    banners: ['https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop&q=60'],
    areaId: '1',
    area: {
      id: '1',
      pincode: 382421,
      areaName: 'Kudasan',
      cityName: 'Gandhinagar',
      stateName: 'Gujarat',
      latitude: 23.1922,
      longitude: 72.6368
    }
  },
  {
    id: '3',
    name: 'Azure Bistro',
    createdAt: new Date().toISOString(),
    mobile: '9876543212',
    email: 'azure@example.com',
    approval: true,
    cuisines: 'Sushi, Desserts, Japanese',
    vegNonveg: 'both',
    applicableTaxBracket: '5',
    trusted: true,
    hours: {
      monday: '10:00 AM - 10:00 PM',
      tuesday: '10:00 AM - 10:00 PM',
      wednesday: '10:00 AM - 10:00 PM',
      thursday: '10:00 AM - 10:00 PM',
      friday: '10:00 AM - 11:00 PM',
      saturday: '11:00 AM - 11:00 PM',
      sunday: '11:00 AM - 10:00 PM'
    },
    address: {
      street: '789 Food Street',
      area: 'Raisan',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382421',
      latitude: 23.1924,
      longitude: 72.6370
    },
    banners: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=60'],
    areaId: '2',
    area: {
      id: '2',
      pincode: 382421,
      areaName: 'Raisan',
      cityName: 'Gandhinagar',
      stateName: 'Gujarat',
      latitude: 23.1924,
      longitude: 72.6370
    }
  }
];

export const areas = [
  'Navrangpura',
  'Maninagar',
  'Thaltej',
  'Bopal',
  'Satellite',
  'CG Road',
];

export const searchPlaceholders = [
  'Search for pizza...',
  'Craving burgers?',
  'Find your favorite sushi...',
  'Discover local restaurants...',
];