import { motion } from 'framer-motion';
import { X } from 'lucide-react'; // Import X icon for deselect button

// Define the interface for a single cuisine object here
export interface Cuisine {
  id: string;
  cuisineName: string;
  imageUrl: string;
}

interface Props {
  cuisine: Cuisine; // Prop will now be a full Cuisine object
  onClick: (cuisineName: string) => void; // Click event passes cuisine name
  isSelected: boolean; // NEW: Prop to indicate if this card is currently selected
}

export const CuisineCard = ({ cuisine, onClick, isSelected }: Props) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      // Conditionally apply border for selection
      className={`w-24 aspect-[1/1.25] relative rounded-xl overflow-hidden cursor-pointer group bg-transparent ${isSelected ? 'border-[3px] border-[#6552FF]/70' : ''}`}
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      // Main click handler for the card body
      onClick={() => onClick(cuisine.cuisineName)} 
    >
      {/* Top Section: Cuisine Image */}
      <div className="w-full h-[75%] object-fit overflow-hidden"> {/* Ensures image takes full width and maintains aspect ratio */}
        {cuisine.imageUrl ? (
          <img
            // src={cuisine.imageUrl}
            src="/assets/burger.png"
            alt={cuisine.cuisineName}
            className="w-full h-full object-cover"
            loading="lazy" // Standard HTML attribute for lazy loading
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/600x400/eeeeee/333333?text=Cuisine";
            }}
          />
        ) : (
          <div className="w-full h-full bg-transparent flex items-center justify-center text-gray-600 font-medium text-lg">
            No Image
          </div>
        )}
      </div>
      
      {/* Gradient Overlay (optional, if you still want it on image) */}
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" /> */}
      
      {/* Bottom Section: Cuisine Name */}
      <div className="p-1 text-center"> {/* Added padding to the name section */}
        <p className="text-xs truncate text-gray-800">{cuisine.cuisineName}</p> {/* Text color changed to black */}
      </div>

      {/* NEW: Cross button for deselection (positioned relative to the entire card) */}
      {isSelected && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 z-10 hover:bg-black/90 focus:outline-none"
          // Crucial: Stop event propagation so clicking the button doesn't trigger card's onClick
          onClick={(e) => { 
            e.stopPropagation(); 
            onClick(cuisine.cuisineName); // Call onClick, App.tsx will handle deselection
          }}
        >
          <X size={16} /> {/* Lucide-react X icon */}
        </motion.button>
      )}
    </motion.div>
  );
};