import { motion } from 'framer-motion';
import { Restaurant } from '../types/restaurant.types';
import { FaStar } from 'react-icons/fa';
import { MapPin } from 'lucide-react';

interface Props {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void; // Click event ab restaurant object ke saath
  isCurrentlyOpen: boolean; // NEW: Prop to indicate if the restaurant is currently open
}

export const RestaurantCard = ({ restaurant, onClick, isCurrentlyOpen }: Props) => {
  const cuisineList = restaurant.cuisines.split(',').map(c => c.trim());
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      // Conditional styling and pointer-events based on isCurrentlyOpen
      className={`
        relative rounded-[25px] overflow-hidden cursor-pointer group
        ${!isCurrentlyOpen ? 'opacity-50 grayscale pointer-events-none' : ''}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      onClick={() => isCurrentlyOpen && onClick(restaurant)} // onClick ko conditionally enable/disable kiya
    >
      <div className="aspect-[1.8/1]">
        {restaurant.banners && restaurant.banners.length > 0 ? (
          <img
            src={restaurant.banners[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading='lazy'
          />
        ) : (
          <div className="w-full h-full bg-green-800 flex items-center justify-center text-gray-200">
            No Image Available
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold truncate mr-2">{restaurant.name}</h3>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded">
            <FaStar size={12} className="text-yellow-400" />
            <span className="text-xs font-medium">{restaurant.trusted ? 'Trusted' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center text-xs text-white/80 gap-1">
          <MapPin size={12} />
          <span className="truncate">{restaurant.address.street}, {restaurant.area.areaName}</span>
        </div>
        
        <div className="mt-1 text-xs text-white/60">
          <span>{cuisineList.join(' • ')}</span>
        </div>
      </div>

      {/* NEW: "Closed" pill, conditionally displayed */}
      {!isCurrentlyOpen && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md z-10">
          Closed
        </div>
      )}
    </motion.div>
  );
};