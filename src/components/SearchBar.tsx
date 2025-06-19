import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaceholders } from '../data'; // Make sure this path is correct

interface SearchBarProps {
  searchText: string; // ✅ NEW: searchText prop
  onSearchChange: (text: string) => void; // ✅ NEW: onSearchChange prop
}

export const SearchBar = ({ searchText, onSearchChange }: SearchBarProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  // ✅ REMOVED: searchText internal state, now using prop

  useEffect(() => {
    const interval = setInterval(() => {
      // ✅ UPDATED: uses searchText prop
      if (!isFocused && !searchText) {
        setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isFocused, searchText]); // ✅ UPDATED: searchText in dependency array

  const clearSearch = () => {
    onSearchChange(''); // ✅ UPDATED: call onSearchChange to clear text
  };

  return (
    <div className="px-4 py-3 max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <AnimatePresence initial={false}>
          <motion.div
            key={searchText ? 'clear' : 'search'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.3, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 z-10 cursor-pointer"
            onClick={searchText ? clearSearch : undefined}
          >
            {searchText ? <X size={20} /> : <Search size={20} />}
          </motion.div>
        </AnimatePresence>

        <input
          type="text"
          value={searchText} // ✅ UPDATED: uses searchText prop
          onChange={(e) => onSearchChange(e.target.value)} // ✅ UPDATED: calls onSearchChange
          className="w-full bg-white rounded-full py-3 pl-12 pr-4 outline-none shadow-sm text-base"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <AnimatePresence mode="wait">
          {!isFocused && !searchText && ( // ✅ UPDATED: uses searchText prop
            <motion.span
              key={placeholderIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute left-12 w-[calc(100%-5rem)] truncate pointer-events-none text-gray-400 text-base"
            >
              {searchPlaceholders[placeholderIndex]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};